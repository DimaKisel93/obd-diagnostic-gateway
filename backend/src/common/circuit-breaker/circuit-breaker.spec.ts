import { CircuitBreaker, CircuitOpenError } from './circuit-breaker';

describe('CircuitBreaker', () => {
  const OPTIONS = { failureThreshold: 3, cooldownMs: 1000, name: 'test' };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts closed and passes successful calls', async () => {
    const cb = new CircuitBreaker(OPTIONS);
    expect(cb.currentState).toBe('closed');

    const result = await cb.execute(async () => 42);
    expect(result).toBe(42);
    expect(cb.currentState).toBe('closed');
  });

  it('resets failure count on success', async () => {
    const cb = new CircuitBreaker(OPTIONS);
    await expect(cb.execute(async () => { throw new Error('x'); })).rejects.toThrow('x');
    await expect(cb.execute(async () => { throw new Error('x'); })).rejects.toThrow('x');
    await cb.execute(async () => 'ok');

    await expect(cb.execute(async () => { throw new Error('x'); })).rejects.toThrow('x');
    await expect(cb.execute(async () => { throw new Error('x'); })).rejects.toThrow('x');
    expect(cb.currentState).toBe('closed');
  });

  it('opens after failure threshold and fast-fails', async () => {
    const cb = new CircuitBreaker(OPTIONS);
    for (let i = 0; i < OPTIONS.failureThreshold; i++) {
      await expect(cb.execute(async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    }
    expect(cb.currentState).toBe('open');

    const action = jest.fn(async () => 'never');
    await expect(cb.execute(action)).rejects.toBeInstanceOf(CircuitOpenError);
    expect(action).not.toHaveBeenCalled();
  });

  it('transitions to half-open after cooldown and recovers on success', async () => {
    const cb = new CircuitBreaker(OPTIONS);
    for (let i = 0; i < OPTIONS.failureThreshold; i++) {
      await expect(cb.execute(async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    }
    expect(cb.currentState).toBe('open');

    jest.advanceTimersByTime(OPTIONS.cooldownMs);
    expect(cb.currentState).toBe('half-open');

    await expect(cb.execute(async () => 'recovered')).resolves.toBe('recovered');
    expect(cb.currentState).toBe('closed');
  });

  it('re-opens when half-open probe fails', async () => {
    const cb = new CircuitBreaker(OPTIONS);
    for (let i = 0; i < OPTIONS.failureThreshold; i++) {
      await expect(cb.execute(async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    }
    jest.advanceTimersByTime(OPTIONS.cooldownMs);
    expect(cb.currentState).toBe('half-open');

    await expect(cb.execute(async () => { throw new Error('still bad'); })).rejects.toThrow('still bad');
    expect(cb.currentState).toBe('open');
  });

  it('reset() returns to initial closed state', async () => {
    const cb = new CircuitBreaker(OPTIONS);
    for (let i = 0; i < OPTIONS.failureThreshold; i++) {
      await expect(cb.execute(async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    }
    expect(cb.isOpen).toBe(true);

    cb.reset();
    expect(cb.currentState).toBe('closed');
    expect(cb.isOpen).toBe(false);
  });
});