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
export class SessionsController {
  constructor(
    private readonly telemetry: TelemetryService,
    private readonly poller: TelemetryPollerService,
  ) {}

  @Get()
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
  async active() {
    const session = await this.telemetry.findActiveSession();
    if (!session) {
      return null;
    }
    const full = await this.telemetry.getSession(session.id);
    return toSessionDto(full);
  }

  @Get(':id')
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    return toSessionDto(await this.telemetry.getSession(id));
  }

  @Get(':id/history')
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
  async end(@Param('id', ParseUUIDPipe) id: string) {
    if (this.poller.getStatus().sessionId === id) {
      await this.poller.stop();
      return toSessionDto(await this.telemetry.getSession(id));
    }

    await this.telemetry.endSession(id);
    return toSessionDto(await this.telemetry.getSession(id));
  }
}
