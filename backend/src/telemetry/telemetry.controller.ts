import {
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { TelemetryPollerService } from './telemetry-poller.service';
import { TelemetryService } from './telemetry.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  SWAGGER_TELEMETRY_STATUS_SUMMARY,
  SWAGGER_TELEMETRY_STATUS_DESCRIPTION,
  SWAGGER_TELEMETRY_START_SUMMARY,
  SWAGGER_TELEMETRY_STOP_SUMMARY,
  SWAGGER_TELEMETRY_SESSION_SUMMARY,
  SWAGGER_TELEMETRY_SESSION_DESCRIPTION,
  SWAGGER_TELEMETRY_LATEST_SUMMARY,
  SWAGGER_TELEMETRY_LATEST_DESCRIPTION,
} from '../common/constants/swagger';

@Controller('telemetry')
@ApiTags('telemetry')
export class TelemetryController {
  constructor(
    private readonly poller: TelemetryPollerService,
    private readonly telemetry: TelemetryService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: SWAGGER_TELEMETRY_STATUS_SUMMARY })
  @ApiResponse({ status: 200, description: SWAGGER_TELEMETRY_STATUS_DESCRIPTION })
  status() {
    return this.poller.getStatus();
  }

  @Post('start')
  @ApiOperation({ summary: SWAGGER_TELEMETRY_START_SUMMARY })
  @ApiResponse({ status: 200, description: SWAGGER_TELEMETRY_START_SUMMARY })
  start() {
    return this.poller.start();
  }

  @Post('stop')
  @ApiOperation({ summary: SWAGGER_TELEMETRY_STOP_SUMMARY })
  @ApiResponse({ status: 200, description: SWAGGER_TELEMETRY_STOP_SUMMARY })
  stop() {
    return this.poller.stop();
  }

  @Get('session')
  @ApiOperation({ summary: SWAGGER_TELEMETRY_SESSION_SUMMARY })
  @ApiResponse({ status: 200, description: SWAGGER_TELEMETRY_SESSION_DESCRIPTION })
  session() {
    return this.telemetry.findActiveSession();
  }

  @Get('latest')
  @ApiOperation({ summary: SWAGGER_TELEMETRY_LATEST_SUMMARY })
  @ApiResponse({ status: 200, description: SWAGGER_TELEMETRY_LATEST_DESCRIPTION })
  latest(@Query('limit') limit?: string) {
    const take = Math.min(Math.max(Number(limit) || 20, 1), 200);
    return this.telemetry.getLatest(take);
  }
}
