import { TelemetryService } from './telemetry.service';
import { PrismaService } from '../prisma/prisma.service';
import { ObdReading } from '../obd/types/telemetry';

describe('TelemetryService', () => {
  let service: TelemetryService;
  let prisma: {
    diagnosticSession: {
      findFirst: jest.Mock;
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
});
