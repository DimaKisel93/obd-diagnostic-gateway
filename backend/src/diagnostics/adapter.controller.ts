import { Body, Controller, Get, Post } from '@nestjs/common';
import { ObdService } from '../obd/obd.service';
import { TelemetryPollerService } from '../telemetry/telemetry-poller.service';
import { AdapterModeService, AdapterMode } from '../obd/services/adapter-mode.service';

@Controller('adapter')
export class AdapterController {
  constructor(
    private readonly obd: ObdService,
    private readonly poller: TelemetryPollerService,
    private readonly adapterModeService: AdapterModeService,
  ) {}

  @Get()
  status() {
    return {
      ...this.obd.getStatus(),
      poller: this.poller.getStatus(),
      mode: this.adapterModeService.getCurrentMode(),
    };
  }

  @Get('mode')
  getMode() {
    return { mode: this.adapterModeService.getCurrentMode() };
  }

  @Post('mode')
  setMode(@Body() body: { mode: AdapterMode }) {
    if (body.mode !== 'mock' && body.mode !== 'elm327') {
      return { error: 'Invalid mode. Use "mock" or "elm327".' };
    }
    this.adapterModeService.setMode(body.mode);
    return { mode: this.adapterModeService.getCurrentMode() };
  }

  @Post('connect')
  connect() {
    return this.obd.connect();
  }

  @Post('disconnect')
  disconnect() {
    return this.obd.disconnect();
  }
}
