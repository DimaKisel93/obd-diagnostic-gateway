import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OBD_ADAPTER,
  ObdAdapter,
} from './interfaces/obd-adapter.interface';
import { DEFAULT_LIVE_PIDS } from './types/pid';
import { ObdConnectionState, ObdReading, ObdStatus } from './types/telemetry';

@Injectable()
export class ObdService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ObdService.name);
  private state: ObdConnectionState = 'disconnected';
  private lastError: string | null = null;

  constructor(
    @Inject(OBD_ADAPTER) private readonly adapter: ObdAdapter,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const autoConnect = this.config.get<string>('OBD_AUTO_CONNECT', 'true') === 'true';
    if (!autoConnect) {
      return;
    }

    try {
      await this.connect();
    } catch (error) {
      // Keep the app running even if hardware is missing — mock should always succeed.
      this.logger.warn(
        `OBD auto-connect failed: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  getStatus(): ObdStatus {
    return {
      adapter: this.adapter.name,
      state: this.state,
      connected: this.adapter.isConnected(),
      lastError: this.lastError,
    };
  }

  async connect(): Promise<ObdStatus> {
    if (this.adapter.isConnected()) {
      this.state = 'connected';
      return this.getStatus();
    }

    this.state = 'connecting';
    this.lastError = null;

    try {
      await this.adapter.connect();
      this.state = 'connected';
      this.logger.log(`OBD adapter "${this.adapter.name}" connected`);
    } catch (error) {
      this.state = 'error';
      this.lastError = error instanceof Error ? error.message : String(error);
      throw error;
    }

    return this.getStatus();
  }

  async disconnect(): Promise<ObdStatus> {
    await this.adapter.disconnect();
    this.state = 'disconnected';
    return this.getStatus();
  }

  async readSample(pids: string[] = DEFAULT_LIVE_PIDS): Promise<ObdReading[]> {
    if (!this.adapter.isConnected()) {
      await this.connect();
    }
    return this.adapter.readPids(pids);
  }
}
