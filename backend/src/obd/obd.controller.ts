import { Controller, Get, Post } from '@nestjs/common';
import { ObdService } from './obd.service';

/**
 * Adapter probe aliases. Canonical REST: GET /api/adapter, GET /api/live.
 */
@Controller('obd')
export class ObdController {
  constructor(private readonly obdService: ObdService) {}

  @Get('status')
  getStatus() {
    return this.obdService.getStatus();
  }

  @Post('connect')
  connect() {
    return this.obdService.connect();
  }

  @Post('disconnect')
  disconnect() {
    return this.obdService.disconnect();
  }

  /** One-shot live sample (RPM, speed, coolant, throttle). */
  @Get('sample')
  sample() {
    return this.obdService.readSample();
  }
}
