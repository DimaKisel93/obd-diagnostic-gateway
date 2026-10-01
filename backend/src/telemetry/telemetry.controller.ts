import { Controller, Get, Post, Query } from '@nestjs/common';
import { TelemetryPollerService } from './telemetry-poller.service';
import { TelemetryService } from './telemetry.service';

/**
 * Probe endpoints for step 4 (polling + persist).
 * Full diagnostics REST API arrives in step 5.
 */
@Controller('telemetry')
export class TelemetryController {
  constructor(
    private readonly poller: TelemetryPollerService,
    private readonly telemetry: TelemetryService,
  ) {}

  @Get('status')
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

  @Get('session')
  session() {
    return this.telemetry.findActiveSession();
  }

  /** Latest rows actually stored in PostgreSQL. */
  @Get('latest')
  latest(@Query('limit') limit?: string) {
    const take = Math.min(Math.max(Number(limit) || 20, 1), 200);
    return this.telemetry.getLatest(take);
  }
}
