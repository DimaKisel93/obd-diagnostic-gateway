import { Injectable, Logger } from '@nestjs/common';
import { ObdAdapter } from '../interfaces/obd-adapter.interface';
import { ObdReading } from '../types/telemetry';

/**
 * Placeholder for a real ELM327 (USB/Bluetooth serial) adapter.
 * Wired in later via the `elm327` npm package / serialport.
 */
@Injectable()
export class Elm327Adapter implements ObdAdapter {
  readonly name = 'elm327';

  private readonly logger = new Logger(Elm327Adapter.name);

  async connect(): Promise<void> {
    this.logger.warn('Real ELM327 adapter is not implemented yet — use OBD_ADAPTER=mock');
    throw new Error('Elm327Adapter is not implemented yet. Set OBD_ADAPTER=mock.');
  }

  async disconnect(): Promise<void> {
    // no-op until hardware support lands
  }

  isConnected(): boolean {
    return false;
  }

  async readPid(_pid: string): Promise<ObdReading> {
    throw new Error('Elm327Adapter is not implemented yet');
  }

  async readPids(_pids: string[]): Promise<ObdReading[]> {
    throw new Error('Elm327Adapter is not implemented yet');
  }
}
