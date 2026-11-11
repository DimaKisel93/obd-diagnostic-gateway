import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { HistoryQueryDto } from './dto/history.query';
import { ListSessionsQueryDto } from './dto/list-sessions.query';
import { TelemetryPollerService } from '../telemetry/telemetry-poller.service';
import { TelemetryService } from '../telemetry/telemetry.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  SWAGGER_SESSIONS_LIST_SUMMARY,
  SWAGGER_SESSIONS_LIST_DESCRIPTION,
  SWAGGER_SESSIONS_ACTIVE_SUMMARY,
  SWAGGER_SESSIONS_ACTIVE_DESCRIPTION,
  SWAGGER_SESSIONS_GET_ONE_SUMMARY,
  SWAGGER_SESSIONS_GET_ONE_DESCRIPTION,
  SWAGGER_SESSIONS_HISTORY_SUMMARY,
  SWAGGER_SESSIONS_HISTORY_DESCRIPTION,
  SWAGGER_SESSIONS_END_SUMMARY,
  SWAGGER_SESSIONS_END_DESCRIPTION,
} from '../common/constants/swagger';

function toSessionDto(session: {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  adapter: string;
  vehicleVin: string | null;
  notes: string | null;
  _count?: { readings: number };
}) {
  return {
    id: session.id,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    adapter: session.adapter,
    vehicleVin: session.vehicleVin,
    notes: session.notes,
    readingsCount: session._count?.readings ?? 0,
  };
}

@Controller('sessions')
@ApiTags('sessions')
export class SessionsController {
  constructor(
    private readonly telemetry: TelemetryService,
    private readonly poller: TelemetryPollerService,
  ) {}

  @Get()
  @ApiOperation({ summary: SWAGGER_SESSIONS_LIST_SUMMARY })
  @ApiResponse({ status: 200, description: SWAGGER_SESSIONS_LIST_DESCRIPTION })
  async list(@Query() query: ListSessionsQueryDto) {
    const result = await this.telemetry.listSessions({
      status: query.status,
      skip: query.skip,
      take: query.take,
    });

    return {
      items: result.items.map(toSessionDto),
      total: result.total,
      skip: result.skip,
      take: result.take,
    };
  }

  @Get('active')
  @ApiOperation({ summary: SWAGGER_SESSIONS_ACTIVE_SUMMARY })
  @ApiResponse({ status: 200, description: SWAGGER_SESSIONS_ACTIVE_DESCRIPTION })
  async active() {
    const session = await this.telemetry.findActiveSession();
    if (!session) {
      return null;
    }
    const full = await this.telemetry.getSession(session.id);
    return toSessionDto(full);
  }

  @Get(':id')
  @ApiOperation({ summary: SWAGGER_SESSIONS_GET_ONE_SUMMARY })
  @ApiResponse({ status: 200, description: SWAGGER_SESSIONS_GET_ONE_DESCRIPTION })
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    return toSessionDto(await this.telemetry.getSession(id));
  }

  @Get(':id/history')
  @ApiOperation({ summary: SWAGGER_SESSIONS_HISTORY_SUMMARY })
  @ApiResponse({ status: 200, description: SWAGGER_SESSIONS_HISTORY_DESCRIPTION })
  async history(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: HistoryQueryDto,
  ) {
    return this.telemetry.getHistory(id, {
      name: query.name,
      pid: query.pid,
      from: query.from,
      to: query.to,
      skip: query.skip,
      take: query.take,
    });
  }

  @Post(':id/end')
  @ApiOperation({ summary: SWAGGER_SESSIONS_END_SUMMARY })
  @ApiResponse({ status: 200, description: SWAGGER_SESSIONS_END_DESCRIPTION })
  async end(@Param('id', ParseUUIDPipe) id: string) {
    if (this.poller.getStatus().sessionId === id) {
      await this.poller.stop();
      return toSessionDto(await this.telemetry.getSession(id));
    }

    await this.telemetry.endSession(id);
    return toSessionDto(await this.telemetry.getSession(id));
  }
}
