import { Controller, Get, Query } from "@nestjs/common";
import { ObdService } from "../obd/obd.service";
import { LatestQueryDto } from "./dto/latest.query";
import { TelemetryPollerService } from "../telemetry/telemetry-poller.service";
import { TelemetryService } from "../telemetry/telemetry.service";

@Controller("live")
export class LiveController {
  constructor(
    private readonly obd: ObdService,
    private readonly telemetry: TelemetryService,
    private readonly poller: TelemetryPollerService,
  ) {}

  /** Fresh sample from the adapter */
  @Get()
  async sample(@Query('pids') pids?: string) {
    const parsed = pids?.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    const readings = await this.obd.readSample(parsed && parsed.length ? parsed : undefined);
    return {
      source: "adapter",
      adapter: this.obd.getStatus().adapter,
      recordedAt: readings[0]?.recordedAt ?? new Date(),
      readings,
    };
  }

  /** Last persisted value per PID (from PostgreSQL). */
  @Get("snapshot")
  async snapshot() {
    const sessionId = this.poller.getStatus().sessionId ?? undefined;
    const readings = await this.telemetry.getSnapshot(sessionId);
    return {
      source: "database",
      sessionId: sessionId ?? null,
      readings,
    };
  }

  /** Recent persisted rows, newest first. */
  @Get("history")
  async history(@Query() query: LatestQueryDto) {
    const sessionId = this.poller.getStatus().sessionId ?? undefined;
    const items = await this.telemetry.getLatest(query.limit, sessionId);
    return {
      source: "database",
      sessionId: sessionId ?? null,
      items,
    };
  }
}
