import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ObdService } from '../obd/obd.service';
import { TelemetryService } from './telemetry.service';

export interface PollerStatus {
  running: boolean;
  intervalMs: number;
  sessionId: string | null;
  ticks: number;
  lastTickAt: Date | null;
  lastError: string | null;
}

@Injectable()
export class TelemetryPollerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelemetryPollerService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private sessionId: string | null = null;
  private ticks = 0;
  private lastTickAt: Date | null = null;
  private lastError: string | null = null;
  private ticking = false;

  constructor(
    private readonly config: ConfigService,
    private readonly obd: ObdService,
    private readonly telemetry: TelemetryService,
  ) {}

  async onModuleInit(): Promise<void> {
    const enabled = this.config.get<string>('OBD_POLL_ENABLED', 'true') === 'true';
    if (!enabled) {
      this.logger.log('Telemetry polling disabled (OBD_POLL_ENABLED=false)');
      return;
    }

    try {
      await this.start();
    } catch (error) {
      this.logger.warn(
        `Auto-start polling failed: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.stop();
  }

  getStatus(): PollerStatus {
    return {
      running: this.timer !== null,
      intervalMs: this.intervalMs(),
      sessionId: this.sessionId,
      ticks: this.ticks,
      lastTickAt: this.lastTickAt,
      lastError: this.lastError,
    };
  }

  async start(): Promise<PollerStatus> {
    if (this.timer) {
      return this.getStatus();
    }

    const session = await this.telemetry.startSession(this.obd.getStatus().adapter);
    this.sessionId = session.id;
    this.ticks = 0;
    this.lastError = null;

    this.timer = setInterval(() => {
      void this.tick();
    }, this.intervalMs());

    this.logger.log(
      `Polling started (session ${this.sessionId}, every ${this.intervalMs()}ms)`,
    );

    await this.tick();
    return this.getStatus();
  }

  async stop(): Promise<PollerStatus> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this.sessionId) {
      try {
        await this.telemetry.endSession(this.sessionId);
      } catch (error) {
        this.logger.warn(
          `Failed to close session ${this.sessionId}: ${
            error instanceof Error ? error.message : error
          }`,
        );
      }
      this.sessionId = null;
    }

    this.logger.log('Polling stopped');
    return this.getStatus();
  }

  private async tick(): Promise<void> {
    if (this.ticking || !this.sessionId) {
      return;
    }

    this.ticking = true;
    try {
      const readings = await this.obd.readSample();
      await this.telemetry.saveReadings(this.sessionId, readings);
      this.ticks += 1;
      this.lastTickAt = new Date();
      this.lastError = null;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Poll tick failed: ${this.lastError}`);
    } finally {
      this.ticking = false;
    }
  }

  private intervalMs(): number {
    const raw = this.config.get<string>('OBD_POLL_INTERVAL_MS', '1000');
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 200 ? parsed : 1000;
  }
}
