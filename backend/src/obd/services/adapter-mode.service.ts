import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MockElm327Adapter } from '../adapters/mock-elm327.adapter';
import { Elm327Adapter } from '../adapters/elm327.adapter';
import { ObdAdapter } from '../interfaces/obd-adapter.interface';

export type AdapterMode = 'mock' | 'elm327';

@Injectable()
export class AdapterModeService {
  private readonly logger = new Logger(AdapterModeService.name);
  private currentMode: AdapterMode = 'mock';
  private readonly mockAdapter: MockElm327Adapter;
  private readonly elm327Adapter: Elm327Adapter;

  constructor(
    @Inject(MockElm327Adapter) mockAdapter: MockElm327Adapter,
    @Inject(Elm327Adapter) elm327Adapter: Elm327Adapter,
    private readonly config: ConfigService,
  ) {
    this.mockAdapter = mockAdapter;
    this.elm327Adapter = elm327Adapter;

    // Initialize mode from config
    const mode = (this.config.get<string>('OBD_ADAPTER') ?? 'mock').toLowerCase() as AdapterMode;
    this.currentMode = mode === 'elm327' ? 'elm327' : 'mock';
  }

  getCurrentMode(): AdapterMode {
    return this.currentMode;
  }

  getAdapter(mode: AdapterMode): ObdAdapter {
    return mode === 'elm327' ? this.elm327Adapter : this.mockAdapter;
  }

  getCurrentAdapter(): ObdAdapter {
    return this.getAdapter(this.currentMode);
  }

  setMode(mode: AdapterMode): void {
    if (mode === this.currentMode) {
      return; // No change needed
    }

    this.logger.log(`Switching adapter from ${this.currentMode} to ${mode}`);
    this.currentMode = mode;
  }
}
