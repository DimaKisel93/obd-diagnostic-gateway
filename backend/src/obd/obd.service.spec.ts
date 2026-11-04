import { ConfigService } from '@nestjs/config';
import { AdapterModeService } from './services/adapter-mode.service';
import { Elm327Adapter } from './adapters/elm327.adapter';
import { MockElm327Adapter } from './adapters/mock-elm327.adapter';
import { ObdService } from './obd.service';

describe('ObdService', () => {
  let service: ObdService;
  let adapter: MockElm327Adapter;

  beforeEach(() => {
    adapter = new MockElm327Adapter();
    const config = {
      get: jest.fn((_key: string, fallback?: string) => fallback ?? 'true'),
    } as unknown as ConfigService;

    const adapterModeService = new AdapterModeService(
      adapter,
      adapter as unknown as Elm327Adapter,
      config,
    );

    service = new ObdService(adapterModeService, config);
  });

  it('connects via adapter and exposes status', async () => {
    const status = await service.connect();
    expect(status.adapter).toBe('mock');
    expect(status.connected).toBe(true);
    expect(status.state).toBe('connected');
  });

  it('returns a live sample after connect', async () => {
    const sample = await service.readSample();
    expect(sample.length).toBeGreaterThan(0);
    expect(service.getStatus().connected).toBe(true);
  });
});
