import { Controller, Get, Post } from '@nestjs/common';
import { ObdService } from '../obd/obd.service';
import { TelemetryPollerService } from '../telemetry/telemetry-poller.service';

@Controller('adapter')
export class AdapterController {
  constructor(
    private readonly obd: ObdService,
    private readonly poller: TelemetryPollerService,
  ) {}

  @Get()
  status() {
    return {
      ...this.obd.getStatus(),
      poller: this.poller.getStatus(),
    };
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
