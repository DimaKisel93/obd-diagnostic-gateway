import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DiagnosticSession,
  Prisma,
  TelemetryReading,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ObdReading } from '../obd/types/telemetry';

export type SessionWithCount = DiagnosticSession & {
  _count: { readings: number };
};

export interface SessionListResult {
  items: SessionWithCount[];
  total: number;
  skip: number;
  take: number;
}

export interface HistoryListResult {
  sessionId: string;
  items: TelemetryReading[];
  total: number;
  skip: number;
  take: number;
}

@Injectable()
export class TelemetryService {
  constructor(private readonly prisma: PrismaService) {}

  async startSession(adapter: string, notes?: string) {
    const open = await this.findActiveSession();
    if (open) {
      return open;
    }

    return this.prisma.diagnosticSession.create({
      data: { adapter, notes },
    });
  }

  async endSession(sessionId: string) {
    const session = await this.prisma.diagnosticSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
    if (session.endedAt) {
      return session;
    }

    return this.prisma.diagnosticSession.update({
      where: { id: sessionId },
      data: { endedAt: new Date() },
    });
  }

  async findActiveSession() {
    return this.prisma.diagnosticSession.findFirst({
      where: { endedAt: null },
      orderBy: { startedAt: 'desc' },
    });
  }

  async listSessions(params: {
    status?: 'active' | 'closed' | 'all';
    skip?: number;
    take?: number;
  }): Promise<SessionListResult> {
    const skip = params.skip ?? 0;
    const take = params.take ?? 20;
    const where: Prisma.DiagnosticSessionWhereInput =
      params.status === 'active'
        ? { endedAt: null }
        : params.status === 'closed'
          ? { endedAt: { not: null } }
          : {};

    const [items, total] = await Promise.all([
      this.prisma.diagnosticSession.findMany({
        where,
        skip,
        take,
        orderBy: { startedAt: 'desc' },
        include: { _count: { select: { readings: true } } },
      }),
      this.prisma.diagnosticSession.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  async getSession(sessionId: string): Promise<SessionWithCount> {
    const session = await this.prisma.diagnosticSession.findUnique({
      where: { id: sessionId },
      include: { _count: { select: { readings: true } } },
    });
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
    return session;
  }

  async getHistory(
    sessionId: string,
    params: {
      name?: string;
      pid?: string;
      from?: string;
      to?: string;
      skip?: number;
      take?: number;
    },
  ): Promise<HistoryListResult> {
    await this.getSession(sessionId);

    const skip = params.skip ?? 0;
    const take = params.take ?? 100;
    const recordedAt: Prisma.DateTimeFilter = {};
    if (params.from) {
      recordedAt.gte = new Date(params.from);
    }
    if (params.to) {
      recordedAt.lte = new Date(params.to);
    }

    const where: Prisma.TelemetryReadingWhereInput = {
      sessionId,
      ...(params.name ? { name: params.name } : {}),
      ...(params.pid ? { pid: params.pid.toUpperCase() } : {}),
      ...(params.from || params.to ? { recordedAt } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.telemetryReading.findMany({
        where,
        skip,
        take,
        orderBy: { recordedAt: 'desc' },
      }),
      this.prisma.telemetryReading.count({ where }),
    ]);

    return { sessionId, items, total, skip, take };
  }

  async saveReadings(sessionId: string, readings: ObdReading[]) {
    if (readings.length === 0) {
      return { count: 0 };
    }

    return this.prisma.telemetryReading.createMany({
      data: readings.map((reading) => ({
        sessionId,
        pid: reading.pid,
        name: reading.name,
        value: reading.value,
        unit: reading.unit,
        recordedAt: reading.recordedAt,
      })),
    });
  }

  async getLatest(limit = 20, sessionId?: string) {
    return this.prisma.telemetryReading.findMany({
      where: sessionId ? { sessionId } : {},
      take: limit,
      orderBy: { recordedAt: 'desc' },
    });
  }

  /** Last persisted sample per metric name (rpm, speed, …). */
  async getSnapshot(sessionId?: string) {
    const rows = await this.prisma.telemetryReading.findMany({
      where: sessionId ? { sessionId } : {},
      orderBy: { recordedAt: 'desc' },
      take: 40,
    });

    const latestByName = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      if (!latestByName.has(row.name)) {
        latestByName.set(row.name, row);
      }
    }
    return [...latestByName.values()];
  }

  async countReadings(sessionId: string) {
    return this.prisma.telemetryReading.count({
      where: { sessionId },
    });
  }
}
