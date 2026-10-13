import { Controller, Get, Post } from '@nestjs/common';
import { TelemetryPollerService } from '../telemetry/telemetry-poller.service';

@Controller('poller')
export class PollerController {
  constructor(private readonly poller: TelemetryPollerService) {}

  @Get()
  status() {
    return this.poller.getStatus();
  }

  @Post('start')
  start() {
    return this.poller.start();
  }

  @Post('stop')
  stop() {
    return this.poller.stop();
  }
}
