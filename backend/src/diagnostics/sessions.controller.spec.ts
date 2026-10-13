import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { TelemetryPollerService } from '../telemetry/telemetry-poller.service';
import { TelemetryService } from '../telemetry/telemetry.service';

const session = {
  id: '11111111-1111-4111-8111-111111111111',
  startedAt: new Date('2026-10-02T10:00:00.000Z'),
  endedAt: null,
  adapter: 'mock',
  vehicleVin: null,
  notes: null,
  _count: { readings: 12 },
};

describe('SessionsController', () => {
  let controller: SessionsController;
  let telemetry: {
    listSessions: jest.Mock;
    findActiveSession: jest.Mock;
    getSession: jest.Mock;
    getHistory: jest.Mock;
    endSession: jest.Mock;
  };
  let poller: { getStatus: jest.Mock; stop: jest.Mock };

  beforeEach(async () => {
    telemetry = {
      listSessions: jest.fn().mockResolvedValue({
        items: [session],
        total: 1,
        skip: 0,
        take: 20,
      }),
      findActiveSession: jest.fn().mockResolvedValue(session),
      getSession: jest.fn().mockResolvedValue(session),
      getHistory: jest.fn().mockResolvedValue({
        sessionId: session.id,
        items: [],
        total: 0,
        skip: 0,
        take: 100,
      }),
      endSession: jest.fn().mockResolvedValue({ ...session, endedAt: new Date() }),
    };
    poller = {
      getStatus: jest.fn().mockReturnValue({ sessionId: null }),
      stop: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionsController],
      providers: [
        { provide: TelemetryService, useValue: telemetry },
        { provide: TelemetryPollerService, useValue: poller },
      ],
    }).compile();

    controller = module.get(SessionsController);
  });

  it('lists sessions with readingsCount', async () => {
    const result = await controller.list({ skip: 0, take: 20, status: 'all' });
    expect(result.total).toBe(1);
    expect(result.items[0].readingsCount).toBe(12);
    expect(result.items[0]).not.toHaveProperty('_count');
  });

  it('returns active session dto', async () => {
    const active = await controller.active();
    expect(active).toEqual(
      expect.objectContaining({ id: session.id, readingsCount: 12 }),
    );
  });

  it('returns null when no active session', async () => {
    telemetry.findActiveSession.mockResolvedValue(null);
    await expect(controller.active()).resolves.toBeNull();
  });

  it('loads history for a session', async () => {
    await controller.history(session.id, { skip: 0, take: 50 });
    expect(telemetry.getHistory).toHaveBeenCalledWith(
      session.id,
      expect.objectContaining({ skip: 0, take: 50 }),
    );
  });

  it('stops the poller when ending the live session', async () => {
    poller.getStatus.mockReturnValue({ sessionId: session.id });
    poller.stop.mockResolvedValue({});
    await controller.end(session.id);
    expect(poller.stop).toHaveBeenCalled();
    expect(telemetry.endSession).not.toHaveBeenCalled();
  });
});

describe('SessionsController errors', () => {
  it('propagates NotFoundException from telemetry', async () => {
    const telemetry = {
      getSession: jest.fn().mockRejectedValue(new NotFoundException('missing')),
      listSessions: jest.fn(),
      findActiveSession: jest.fn(),
      getHistory: jest.fn(),
      endSession: jest.fn(),
    };
    const poller = { getStatus: jest.fn(), stop: jest.fn() };
    const module = await Test.createTestingModule({
      controllers: [SessionsController],
      providers: [
        { provide: TelemetryService, useValue: telemetry },
        { provide: TelemetryPollerService, useValue: poller },
      ],
    }).compile();

    const controller = module.get(SessionsController);
    await expect(controller.getOne(session.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
