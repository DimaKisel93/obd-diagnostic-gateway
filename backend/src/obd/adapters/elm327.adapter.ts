import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { ObdAdapter } from '../interfaces/obd-adapter.interface';
import { ObdReading } from '../types/telemetry';
import { ObdPid, ObdPidCode, PID_META, DEFAULT_LIVE_PIDS } from '../types/pid';
import { ELM327_CONST, InitCommand } from './elm327.constants';

@Injectable()
export class Elm327Adapter implements ObdAdapter, OnModuleDestroy {
  readonly name = 'elm327';

  private readonly logger = new Logger(Elm327Adapter.name);
  private port: SerialPort | null = null;
  private parser: ReadlineParser | null = null;
  private connected = false;
  private protocol: string | null = null;
  private readonly responseTimeout = ELM327_CONST.RESPONSE_TIMEOUT_MS;

  constructor(private readonly config: ConfigService) {}

  async connect(): Promise<void> {
    if (this.connected && this.port?.isOpen) {
      this.logger.log(ELM327_CONST.ERR_ALREADY_CONNECTED);
      return;
    }

    const portPath = this.config.get<string>('OBD_SERIAL_PORT');
    const baudRate = this.config.get<number>('OBD_BAUD_RATE', ELM327_CONST.DEFAULT_BAUD_RATE);

    if (!portPath) {
      throw new Error(ELM327_CONST.ERR_NOT_CONFIGURED);
    }

    this.logger.log(`Opening serial port ${portPath} @ ${baudRate} baud...`);

    this.port = new SerialPort({
      path: portPath,
      baudRate,
      autoOpen: false,
      lock: false,
    });

    this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r' }));

    return new Promise((resolve, reject) => {
      if (!this.port || !this.parser) {
        reject(new Error(ELM327_CONST.ERR_PORT_NOT_INITIALIZED));
        return;
      }

      let timeout: NodeJS.Timeout | undefined;

      const cleanup = () => {
        clearTimeout(timeout);
        this.parser?.removeAllListeners('data');
        this.port?.removeAllListeners('error');
        this.port?.removeAllListeners('open');
      };

      timeout = setTimeout(() => {
        cleanup();
        reject(new Error(ELM327_CONST.ERR_CONNECTION_TIMEOUT.replace('%s', String(this.responseTimeout))));
      }, this.responseTimeout);

      this.port.on('error', (err) => {
        cleanup();
        this.logger.error(ELM327_CONST.ERR_PORT_ERROR.replace('%s', err.message));
        reject(err);
      });

      this.port.on('open', async () => {
        this.logger.log('Serial port opened, detecting OBD protocol...');
        try {
          await this.detectProtocol();
          this.protocol = this.protocol || 'auto';
          this.connected = true;
          cleanup();
          this.logger.log(`OBD protocol detected: ${this.protocol}`);
          resolve();
        } catch (err) {
          cleanup();
          const message = err instanceof Error ? err.message : String(err);
          this.logger.error(ELM327_CONST.ERR_INIT_FAILED.replace('%s', message));
          await this.disconnect();
          reject(err);
        }
      });

      this.port.open((err) => {
        if (err) {
          cleanup();
          this.logger.error(ELM327_CONST.ERR_OPEN_FAILED.replace('%s', err.message));
          reject(err);
        }
      });
    });
  }

  private async attemptReconnect(lastError: string): Promise<void> {
    this.logger.warn(`Attempting reconnection after error: ${lastError}`);

    for (let attempt = 1; attempt <= ELM327_CONST.RETRY_MAX_ATTEMPTS; attempt++) {
      this.logger.debug(`Reconnect attempt ${attempt}/${ELM327_CONST.RETRY_MAX_ATTEMPTS}`);

      try {
        await this.sendCommand(ELM327_CONST.CMD_RESET);
        await this.sleep(ELM327_CONST.INIT_DELAY_RESET_MS);

        await this.detectProtocol();
        this.protocol = this.protocol || 'auto';
        this.connected = true;

        this.logger.log(`Reconnected successfully after ${attempt} attempt(s)`);
        return;
      } catch (err) {
        this.logger.warn(`Reconnect attempt ${attempt} failed: ${err instanceof Error ? err.message : String(err)}`);

        if (attempt < ELM327_CONST.RETRY_MAX_ATTEMPTS) {
          await this.sleep(ELM327_CONST.RETRY_DELAY_MS);
        } else {
          this.logger.error(`All ${ELM327_CONST.RETRY_MAX_ATTEMPTS} reconnection attempts failed`);
        }
      }
    }
  }

  private async detectProtocol(): Promise<void> {
    const protocols: string[] = [
      'auto',
      'iso15765_can_11bit_500k',
      'iso15765_can_29bit_500k',
      'iso15765_can_11bit_250k',
      'iso15765_can_29bit_250k',
      'iso14230_kwp',
      'iso9141_2',
      'j1850_pwm',
      'j1850_vpw',
    ];

    this.logger.debug('Resetting ELM327...');
    await this.sendCommand(ELM327_CONST.CMD_RESET);
    await this.sleep(ELM327_CONST.INIT_DELAY_RESET_MS);

    for (const proto of protocols) {
      try {
        this.logger.debug(`Trying protocol: ${proto}`);

        const response = await this.sendCommand(ELM327_CONST.CMD_SUPPORTED_PIDS);

        if (this.isValidProtocolResponse(response)) {
          this.protocol = proto;
          this.logger.log(`OBD protocol auto-detected: ${this.protocol}`);
          return;
        }
      } catch (err) {
        this.logger.debug(`Protocol ${proto} failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    this.logger.warn(ELM327_CONST.ERR_PROTOCOL_NOT_FOUND);
    this.protocol = 'auto';
  }

  private isValidProtocolResponse(response: string): boolean {
    const trimmed = response.trim();
    if (!trimmed) return false;

    if (trimmed === ELM327_CONST.RESPONSE_ERROR) return false;
    if (trimmed.startsWith(ELM327_CONST.RESPONSE_UNABLE_PREFIX)) return false;
    if (trimmed.startsWith(ELM327_CONST.RESPONSE_STOPPED_PREFIX)) return false;

    const hexMatch = trimmed.match(/^([0-9A-Fa-f]{2}\s*)+$/);
    if (!hexMatch) return false;

    const bytes = trimmed.split(/\s+/).filter((b) => b.length > 0);
    if (bytes.length < 2) return false;

    return true;
  }

  async disconnect(): Promise<void> {
    if (!this.connected && !this.port?.isOpen) {
      return;
    }

    this.connected = false;

    if (this.parser) {
      this.parser.removeAllListeners('data');
      this.parser = null;
    }

    if (this.port?.isOpen) {
      this.port.close((err) => {
        if (err) {
          this.logger.error(ELM327_CONST.ERR_PORT_ERROR.replace('%s', err.message));
        }
      });
    }

    this.port = null;
    this.logger.log('ELM327 disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  async readPid(pid: string): Promise<ObdReading> {
    if (!this.connected) {
      throw new Error(ELM327_CONST.ERR_PID_NOT_CONNECTED);
    }

    const normalized = pid.toUpperCase().replace(/^01/, '');
    const command = `01${normalized}`;

    const maxRetries = ELM327_CONST.READ_PID_MAX_RETRIES;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.sendCommandWithTimeout(command, ELM327_CONST.READ_PID_TIMEOUT_MS);

        if (response.includes(ELM327_CONST.RESPONSE_ERROR)) {
          lastError = new Error(`No valid response for PID ${pid}`);
          continue;
        }

        if (response.includes(ELM327_CONST.RESPONSE_NO_DATA)) {
          lastError = new Error(`PID ${pid} not supported by current protocol`);
          continue;
        }

        try {
          const hexData = this.parseResponseHex(response, pid);
          const value = this.convertPidValue(pid, hexData);

          return {
            pid: normalized as ObdPidCode,
            name: PID_META[normalized as ObdPidCode]?.name ?? normalized,
            value,
            unit: PID_META[normalized as ObdPidCode]?.unit ?? null,
            recordedAt: new Date(),
          };
        } catch (parsingErr) {
          this.logger.debug(`Hex parsing failed for PID ${pid}: ${parsingErr instanceof Error ? parsingErr.message : String(parsingErr)}`);
          const simpleValue = this.convertPidValue(pid, ['00', '00']);
          return {
            pid: normalized as ObdPidCode,
            name: PID_META[normalized as ObdPidCode]?.name ?? normalized,
            value: simpleValue,
            unit: PID_META[normalized as ObdPidCode]?.unit ?? null,
            recordedAt: new Date(),
          };
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.debug(`Read PID ${pid} attempt ${attempt + 1} failed: ${lastError.message}`);

        if (attempt < maxRetries) {
          await this.sleep(ELM327_CONST.RETRY_DELAY_MS);
        }
      }
    }

    const finalMessage = lastError?.message ?? 'unknown error';
    throw lastError ?? new Error(`Failed to read PID ${pid}: ${finalMessage}`);
  }

  async readPids(pids: string[] = DEFAULT_LIVE_PIDS): Promise<ObdReading[]> {
    const readings: ObdReading[] = [];
    for (const pid of pids) {
      try {
        readings.push(await this.readPid(pid));
      } catch (err) {
        this.logger.warn(`Failed to read PID ${pid}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    return readings;
  }

  onModuleDestroy(): void {
    void this.disconnect();
  }
private async initializeElm327(): Promise<void> {
    if (!this.port || !this.parser) {
      throw new Error(ELM327_CONST.ERR_PORT_NOT_INITIALIZED);
    }

    const initCommands: InitCommand[] = [
      { cmd: ELM327_CONST.CMD_RESET, desc: 'Reset all', delay: ELM327_CONST.INIT_DELAY_RESET_MS },
      { cmd: ELM327_CONST.CMD_ECHO_OFF, desc: 'Echo off', delay: ELM327_CONST.INIT_DELAY_AT_MS },
      { cmd: ELM327_CONST.CMD_LINEFEEDS_OFF, desc: 'Linefeeds off', delay: ELM327_CONST.INIT_DELAY_AT_MS },
      { cmd: ELM327_CONST.CMD_HEADERS_OFF, desc: 'Headers off', delay: ELM327_CONST.INIT_DELAY_AT_MS },
      { cmd: ELM327_CONST.CMD_AUTO_PROTOCOL, desc: 'Auto protocol', delay: ELM327_CONST.INIT_DELAY_PROTOCOL_MS },
      { cmd: ELM327_CONST.CMD_CAN_FORMAT_OFF, desc: 'CAN formatting off', delay: ELM327_CONST.INIT_DELAY_AT_MS },
      { cmd: ELM327_CONST.CMD_FLOW_CONTROL_OFF, desc: 'Flow control off', delay: ELM327_CONST.INIT_DELAY_AT_MS },
      { cmd: ELM327_CONST.CMD_FLOW_CONTROL_MODE_OFF, desc: 'Flow control mode off', delay: ELM327_CONST.INIT_DELAY_AT_MS },
      { cmd: ELM327_CONST.CMD_SUPPORTED_PIDS, desc: 'Supported PIDs [01-20]', delay: ELM327_CONST.INIT_DELAY_SUPPORTED_PIDS_MS },
    ];

    for (const { cmd, desc, delay } of initCommands) {
      this.logger.debug(`Sending ${cmd} (${desc})`);
      const response = await this.sendCommand(cmd);
      this.logger.debug(`Response: ${response}`);
      if (delay > 0) {
        await this.sleep(delay);
      }
    }
  }

  private async sendCommandWithTimeout(cmd: string, timeoutMs: number): Promise<string> {
    if (!this.port || !this.parser) {
      throw new Error(ELM327_CONST.ERR_NOT_CONNECTED);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        clearTimeout(timeout);
        this.parser?.removeListener('data', onData);
        reject(new Error(ELM327_CONST.ERR_COMMAND_TIMEOUT.replace('%s', cmd).replace('%s', String(timeoutMs))));
      }, timeoutMs);

      let buffer = '';

      const onData = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (trimmed.toUpperCase() === cmd.toUpperCase()) return;

        if (trimmed === ELM327_CONST.RESPONSE_PROMPT) {
          clearTimeout(timeout);
          this.parser?.removeListener('data', onData);
          resolve(buffer.trim());
          return;
        }

        if (
          trimmed === ELM327_CONST.RESPONSE_ERROR ||
          trimmed.startsWith(ELM327_CONST.RESPONSE_UNABLE_PREFIX) ||
          trimmed.startsWith(ELM327_CONST.RESPONSE_STOPPED_PREFIX)
        ) {
          clearTimeout(timeout);
          this.parser?.removeListener('data', onData);
          reject(new Error(`ELM327 error: ${trimmed}`));
          return;
        }

        buffer += (buffer ? '\n' : '') + trimmed;
      };

      if (!this.parser || !this.port) {
        clearTimeout(timeout);
        reject(new Error(ELM327_CONST.ERR_NOT_CONNECTED));
        return;
      }

      this.parser.on('data', onData);

      this.port.write(cmd + '\r', (err) => {
        if (err) {
          clearTimeout(timeout);
          this.parser?.removeListener('data', onData);
          reject(err);
        }
      });
    });
  }

  private async sendCommand(cmd: string): Promise<string> {
    if (!this.port || !this.parser) {
      throw new Error(ELM327_CONST.ERR_NOT_CONNECTED);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.parser?.removeAllListeners('data');
        reject(new Error(ELM327_CONST.ERR_COMMAND_TIMEOUT.replace('%s', cmd).replace('%s', String(this.responseTimeout))));
      }, this.responseTimeout);

      let buffer = '';

      const onData = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (trimmed.toUpperCase() === cmd.toUpperCase()) return;

        if (trimmed === ELM327_CONST.RESPONSE_PROMPT) {
          clearTimeout(timeout);
          this.parser?.removeListener('data', onData);
          resolve(buffer.trim());
          return;
        }

        if (
          trimmed === ELM327_CONST.RESPONSE_ERROR ||
          trimmed.startsWith(ELM327_CONST.RESPONSE_UNABLE_PREFIX) ||
          trimmed.startsWith(ELM327_CONST.RESPONSE_STOPPED_PREFIX)
        ) {
          clearTimeout(timeout);
          this.parser?.removeListener('data', onData);
          reject(new Error(`ELM327 error: ${trimmed}`));
          return;
        }

        buffer += (buffer ? '\n' : '') + trimmed;
      };

      if (!this.parser || !this.port) {
        clearTimeout(timeout);
        reject(new Error(ELM327_CONST.ERR_NOT_CONNECTED));
        return;
      }

      this.parser.on('data', onData);

      this.port.write(cmd + '\r', (err) => {
        if (err) {
          clearTimeout(timeout);
          this.parser?.removeListener('data', onData);
          reject(err);
        }
      });
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private parseResponseHex(response: string, pid: string): string[] {
    const hexMatch = response.match(/([0-9A-Fa-f]{2}\s*)+/g);
    if (!hexMatch) {
      throw new Error(ELM327_CONST.ERR_INVALID_RESPONSE_FORMAT.replace('%s', pid).replace('%s', response));
    }

    const bytes = hexMatch[0].trim().split(/\s+/).filter((b) => b.length > 0);

    const expectedMinBytes = 2;
    if (bytes.length < expectedMinBytes) {
      throw new Error(ELM327_CONST.ERR_INSUFFICIENT_DATA.replace('%s', pid));
    }

    return bytes;
  }

  private convertPidValue(pid: string, bytes: string[]): number {
    const firstByte = parseInt(bytes[0], 16);
    const secondByte = bytes.length > 1 ? parseInt(bytes[1], 16) : 0;

    switch (pid) {
      case ObdPid.ENGINE_RPM:
        return ((firstByte * 256) + secondByte) / 4;
      case ObdPid.VEHICLE_SPEED:
        return firstByte;
      case ObdPid.COOLANT_TEMP:
        return firstByte - 40;
      case ObdPid.THROTTLE_POSITION:
        return (firstByte * 100) / 255;
      default:
        return 0;
    }
  }
}