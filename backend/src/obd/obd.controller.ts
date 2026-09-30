import { Controller, Get, Post } from '@nestjs/common';
import { ObdService } from './obd.service';

/**
 * Temporary probe endpoints so step 3 is manually testable.
 * Full diagnostics API arrives in step 5.
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
