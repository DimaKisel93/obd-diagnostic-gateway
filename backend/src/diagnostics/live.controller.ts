import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ObdService } from '../obd/obd.service';
import { LatestQueryDto } from './dto/latest.query';
import { TelemetryPollerService } from '../telemetry/telemetry-poller.service';
import { TelemetryService } from '../telemetry/telemetry.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  SWAGGER_LIVE_SAMPLE_SUMMARY,
  SWAGGER_LIVE_SAMPLE_DESCRIPTION,
  SWAGGER_SNAPSHOT_SUMMARY,
  SWAGGER_SNAPSHOT_DESCRIPTION,
  SWAGGER_HISTORY_SUMMARY,
  SWAGGER_HISTORY_DESCRIPTION,
  SWAGGER_DATA_SOURCE_ADAPTER,
  SWAGGER_DATA_SOURCE_DATABASE,
} from '../common/constants/swagger';

@Controller('live')
@ApiTags('telemetry')
export class LiveController {
  constructor(
    private readonly obd: ObdService,
    private readonly telemetry: TelemetryService,
    private readonly poller: TelemetryPollerService,
  ) {}

  /** Fresh sample from the adapter */
  @Get()
  @ApiOperation({ summary: SWAGGER_LIVE_SAMPLE_SUMMARY })
  @ApiResponse({ status: 200, description: SWAGGER_LIVE_SAMPLE_DESCRIPTION })
  async sample(@Query('pids') pids?: string) {
    const parsed = pids?.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    const readings = await this.obd.readSample(parsed && parsed.length ? parsed : undefined);
    return {
      source: SWAGGER_DATA_SOURCE_ADAPTER,
      adapter: this.obd.getStatus().adapter,
      recordedAt: readings[0]?.recordedAt ?? new Date(),
      readings,
    };
  }

  @Get('snapshot')
  @ApiOperation({ summary: SWAGGER_SNAPSHOT_SUMMARY })
  @ApiResponse({ status: 200, description: SWAGGER_SNAPSHOT_DESCRIPTION })
  async snapshot() {
    const sessionId = this.poller.getStatus().sessionId ?? undefined;
    const readings = await this.telemetry.getSnapshot(sessionId);
    return {
      source: SWAGGER_DATA_SOURCE_DATABASE,
      sessionId: sessionId ?? null,
      readings,
    };
  }

  @Get('history')
  @ApiOperation({ summary: SWAGGER_HISTORY_SUMMARY })
  @ApiResponse({ status: 200, description: SWAGGER_HISTORY_DESCRIPTION })
  async history(@Query() query: LatestQueryDto) {
    const sessionId = this.poller.getStatus().sessionId ?? undefined;
    const items = await this.telemetry.getLatest(query.limit, sessionId, query.pid);
    return {
      source: SWAGGER_DATA_SOURCE_DATABASE,
      sessionId: sessionId ?? null,
      items,
    };
  }
}
