import { Injectable, Logger } from '@nestjs/common';
import { ObdAdapter } from '../interfaces/obd-adapter.interface';
import { DEFAULT_LIVE_PIDS, ObdPid, PID_META, ObdPidCode } from '../types/pid';
import { ObdReading } from '../types/telemetry';

/**
 * Simulated ELM327 for local development without hardware.
 * Generates plausible RPM / speed / coolant / throttle curves.
 */
@Injectable()
export class MockElm327Adapter implements ObdAdapter {
  readonly name = 'mock';

  private readonly logger = new Logger(MockElm327Adapter.name);
  private connected = false;
  private startedAt = 0;

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    // Simulate ELM327 init delay (ATZ / ATE0 / protocol detect).
    await this.delay(80);
    this.startedAt = Date.now();
    this.connected = true;
    this.logger.log('Mock ELM327 connected');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.logger.log('Mock ELM327 disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  async readPid(pid: string): Promise<ObdReading> {
    this.assertConnected();

    const normalized = pid.toUpperCase().replace(/^01/, '');
    if (!(normalized in PID_META)) {
      throw new Error(`Unsupported PID: ${pid}`);
    }

    const code = normalized as ObdPidCode;
    const meta = PID_META[code];
    const value = this.computeValue(code);

    // Tiny latency like a real serial round-trip.
    await this.delay(15);

    return {
      pid: code,
      name: meta.name,
      value,
      unit: meta.unit,
      recordedAt: new Date(),
    };
  }

  async readPids(pids: string[] = DEFAULT_LIVE_PIDS): Promise<ObdReading[]> {
    const readings: ObdReading[] = [];
    for (const pid of pids) {
      readings.push(await this.readPid(pid));
    }
    return readings;
  }

  private computeValue(pid: ObdPidCode): number {
    const t = (Date.now() - this.startedAt) / 1000;

    switch (pid) {
      case ObdPid.ENGINE_RPM: {
        // Idle ~800, then gently varies 800–3200.
        const rpm = 800 + 1200 * (0.5 + 0.5 * Math.sin(t / 4)) + 200 * Math.sin(t / 1.7);
        return Math.round(rpm);
      }
      case ObdPid.VEHICLE_SPEED: {
        // City-ish 0–90 km/h wave.
        const speed = Math.max(0, 45 + 40 * Math.sin(t / 6) + 8 * Math.sin(t / 2.3));
        return Math.round(speed);
      }
      case ObdPid.COOLANT_TEMP: {
        // Warm-up from ~40°C toward ~90°C.
        const warmed = 40 + 50 * (1 - Math.exp(-t / 40));
        return Math.round(warmed * 10) / 10;
      }
      case ObdPid.THROTTLE_POSITION: {
        const throttle = 12 + 35 * (0.5 + 0.5 * Math.sin(t / 3.2));
        return Math.round(throttle * 10) / 10;
      }
      default:
        return 0;
    }
  }

  private assertConnected(): void {
    if (!this.connected) {
      throw new Error('Mock ELM327 is not connected');
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
