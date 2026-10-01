import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ObdReading } from '../obd/types/telemetry';

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

  async getLatest(limit = 20) {
    return this.prisma.telemetryReading.findMany({
      take: limit,
      orderBy: { recordedAt: 'desc' },
    });
  }

  async countReadings(sessionId: string) {
    return this.prisma.telemetryReading.count({
      where: { sessionId },
    });
  }
}
