import { ConfigService } from '@nestjs/config';
import { ObdService } from '../obd/obd.service';
import { TelemetryPollerService } from './telemetry-poller.service';
import { TelemetryService } from './telemetry.service';

describe('TelemetryPollerService', () => {
  let poller: TelemetryPollerService;
  let obd: { getStatus: jest.Mock; readSample: jest.Mock };
  let telemetry: {
    startSession: jest.Mock;
    endSession: jest.Mock;
    saveReadings: jest.Mock;
  };

  beforeEach(() => {
    jest.useFakeTimers();

    obd = {
      getStatus: jest.fn().mockReturnValue({ adapter: 'mock' }),
      readSample: jest.fn().mockResolvedValue([
        {
          pid: '0C',
          name: 'rpm',
          value: 1200,
          unit: 'rpm',
          recordedAt: new Date(),
        },
      ]),
    };

    telemetry = {
      startSession: jest.fn().mockResolvedValue({ id: 'session-1' }),
      endSession: jest.fn().mockResolvedValue({ id: 'session-1' }),
      saveReadings: jest.fn().mockResolvedValue({ count: 1 }),
    };

    const config = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'OBD_POLL_INTERVAL_MS') {
          return '1000';
        }
        return fallback ?? 'true';
      }),
    } as unknown as ConfigService;

    poller = new TelemetryPollerService(
      config,
      obd as unknown as ObdService,
      telemetry as unknown as TelemetryService,
    );
  });

  afterEach(async () => {
    await poller.stop();
    jest.useRealTimers();
  });

  it('opens a session, ticks immediately, and persists readings', async () => {
    const status = await poller.start();

    expect(status.running).toBe(true);
    expect(status.sessionId).toBe('session-1');
    expect(telemetry.startSession).toHaveBeenCalledWith('mock');
    expect(obd.readSample).toHaveBeenCalledTimes(1);
    expect(telemetry.saveReadings).toHaveBeenCalledTimes(1);
  });

  it('closes the session on stop', async () => {
    await poller.start();
    const status = await poller.stop();

    expect(status.running).toBe(false);
    expect(status.sessionId).toBeNull();
    expect(telemetry.endSession).toHaveBeenCalledWith('session-1');
  });
});
