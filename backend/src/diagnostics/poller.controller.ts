import { Controller, Get, Post } from '@nestjs/common';
import { TelemetryPollerService } from '../telemetry/telemetry-poller.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  SWAGGER_POLLER_STATUS_SUMMARY,
  SWAGGER_POLLER_STATUS_DESCRIPTION,
  SWAGGER_START_SUMMARY,
  SWAGGER_POLLER_STARTED_DESCRIPTION,
  SWAGGER_STOP_SUMMARY,
  SWAGGER_POLLER_STOPPED_DESCRIPTION,
} from '../common/constants/swagger';

@Controller('poller')
@ApiTags('telemetry')
export class PollerController {
  constructor(private readonly poller: TelemetryPollerService) {}

  @Get()
  @ApiOperation({ summary: SWAGGER_POLLER_STATUS_SUMMARY })
  @ApiResponse({ status: 200, description: SWAGGER_POLLER_STATUS_DESCRIPTION })
  status() {
    return this.poller.getStatus();
  }

  @Post('start')
  @ApiOperation({ summary: SWAGGER_START_SUMMARY })
  @ApiResponse({ status: 200, description: SWAGGER_POLLER_STARTED_DESCRIPTION })
  start() {
    return this.poller.start();
  }

  @Post('stop')
  @ApiOperation({ summary: SWAGGER_STOP_SUMMARY })
  @ApiResponse({ status: 200, description: SWAGGER_POLLER_STOPPED_DESCRIPTION })
  stop() {
    return this.poller.stop();
  }
}
