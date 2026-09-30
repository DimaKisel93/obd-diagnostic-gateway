import { ConfigService } from '@nestjs/config';
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

    service = new ObdService(adapter, config);
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
