import { TelemetryService } from './telemetry.service';
import { PrismaService } from '../prisma/prisma.service';
import { ObdReading } from '../obd/types/telemetry';

describe('TelemetryService', () => {
  let service: TelemetryService;
  let prisma: {
    diagnosticSession: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    telemetryReading: {
      createMany: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      diagnosticSession: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({
          id: 'session-1',
          adapter: 'mock',
          endedAt: null,
        }),
        update: jest.fn().mockResolvedValue({
          id: 'session-1',
          endedAt: new Date(),
        }),
      },
      telemetryReading: {
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    service = new TelemetryService(prisma as unknown as PrismaService);
  });

  it('creates a session when none is open', async () => {
    const session = await service.startSession('mock');
    expect(prisma.diagnosticSession.create).toHaveBeenCalledWith({
      data: { adapter: 'mock', notes: undefined },
    });
    expect(session.id).toBe('session-1');
  });

  it('reuses an already open session', async () => {
    prisma.diagnosticSession.findFirst.mockResolvedValue({
      id: 'open-session',
      adapter: 'mock',
      endedAt: null,
    });

    const session = await service.startSession('mock');
    expect(prisma.diagnosticSession.create).not.toHaveBeenCalled();
    expect(session.id).toBe('open-session');
  });

  it('persists a batch of readings', async () => {
    const readings: ObdReading[] = [
      {
        pid: '0C',
        name: 'rpm',
        value: 1500,
        unit: 'rpm',
        recordedAt: new Date('2026-10-01T12:00:00.000Z'),
      },
      {
        pid: '0D',
        name: 'speed',
        value: 40,
        unit: 'km/h',
        recordedAt: new Date('2026-10-01T12:00:00.000Z'),
      },
    ];

    await expect(service.saveReadings('session-1', readings)).resolves.toEqual({
      count: 2,
    });
    expect(prisma.telemetryReading.createMany).toHaveBeenCalledTimes(1);
  });

  it('lists sessions with pagination', async () => {
    prisma.diagnosticSession.findMany.mockResolvedValue([
      { id: 'session-1', _count: { readings: 4 } },
    ]);
    prisma.diagnosticSession.count.mockResolvedValue(1);

    const result = await service.listSessions({ status: 'active', skip: 0, take: 20 });
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(prisma.diagnosticSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { endedAt: null },
        skip: 0,
        take: 20,
      }),
    );
  });

  it('throws when session is missing', async () => {
    await expect(service.getSession('missing')).rejects.toThrow(/not found/i);
  });

  it('filters history by name and pid', async () => {
    prisma.diagnosticSession.findUnique.mockResolvedValue({
      id: 'session-1',
      _count: { readings: 0 },
    });
    prisma.telemetryReading.findMany.mockResolvedValue([]);
    prisma.telemetryReading.count.mockResolvedValue(0);

    await service.getHistory('session-1', { name: 'rpm', pid: '0c', skip: 0, take: 10 });
    expect(prisma.telemetryReading.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          sessionId: 'session-1',
          name: 'rpm',
          pid: '0C',
        }),
      }),
    );
  });
});
