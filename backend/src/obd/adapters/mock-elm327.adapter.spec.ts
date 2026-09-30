import { MockElm327Adapter } from './mock-elm327.adapter';
import { ObdPid } from '../types/pid';

describe('MockElm327Adapter', () => {
  let adapter: MockElm327Adapter;

  beforeEach(() => {
    adapter = new MockElm327Adapter();
  });

  it('connects and reports connected state', async () => {
    expect(adapter.isConnected()).toBe(false);
    await adapter.connect();
    expect(adapter.isConnected()).toBe(true);
    expect(adapter.name).toBe('mock');
  });

  it('reads RPM and speed with expected metadata', async () => {
    await adapter.connect();

    const rpm = await adapter.readPid(ObdPid.ENGINE_RPM);
    expect(rpm.pid).toBe('0C');
    expect(rpm.name).toBe('rpm');
    expect(rpm.unit).toBe('rpm');
    expect(rpm.value).toBeGreaterThan(0);

    const speed = await adapter.readPid(ObdPid.VEHICLE_SPEED);
    expect(speed.pid).toBe('0D');
    expect(speed.name).toBe('speed');
    expect(speed.unit).toBe('km/h');
    expect(speed.value).toBeGreaterThanOrEqual(0);
  });

  it('reads a batch of live PIDs', async () => {
    await adapter.connect();
    const readings = await adapter.readPids();
    expect(readings.length).toBeGreaterThanOrEqual(4);
    expect(readings.map((r) => r.name)).toEqual(
      expect.arrayContaining(['rpm', 'speed', 'coolant_temp', 'throttle']),
    );
  });

  it('throws when reading while disconnected', async () => {
    await expect(adapter.readPid(ObdPid.ENGINE_RPM)).rejects.toThrow(
      /not connected/i,
    );
  });
});
