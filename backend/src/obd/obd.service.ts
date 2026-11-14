import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ObdAdapter } from './interfaces/obd-adapter.interface';
import { DEFAULT_LIVE_PIDS } from './types/pid';
import { ObdConnectionState, ObdReading, ObdStatus } from './types/telemetry';
import { AdapterModeService } from './services/adapter-mode.service';
import {
  CircuitBreaker,
  CircuitBreakerState,
} from '../common/circuit-breaker/circuit-breaker';

@Injectable()
export class ObdService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ObdService.name);
  private state: ObdConnectionState = 'disconnected';
  private lastError: string | null = null;
  private readonly breaker: CircuitBreaker;

  constructor(
    private readonly adapterModeService: AdapterModeService,
    private readonly config: ConfigService,
  ) {
    this.breaker = new CircuitBreaker({
      name: 'obd-adapter',
      failureThreshold: Number(config.get('OBD_CB_FAILURE_THRESHOLD', '5')),
      cooldownMs: Number(config.get('OBD_CB_COOLDOWN_MS', '30000')),
    });
  }

  private get adapter(): ObdAdapter {
    return this.adapterModeService.getCurrentAdapter();
  }

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

  getCircuitBreakerState(): CircuitBreakerState {
    return this.breaker.currentState;
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

    return this.breaker.execute(async () => {
      if (!this.adapter.isConnected()) {
        await this.connect();
      }
      return this.adapter.readPids(pids);
    });
  }
}
