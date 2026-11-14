export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  failureThreshold: number;
  cooldownMs: number;
  name?: string;
}

export class CircuitOpenError extends Error {
  constructor(
    message: string,
    public readonly retryAfterMs: number,
  ) {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

export class CircuitBreaker {
  private state: CircuitBreakerState = 'closed';
  private failures = 0;
  private openedAt: number | null = null;

  constructor(private readonly options: CircuitBreakerOptions) {}

  get currentState(): CircuitBreakerState {
    this.refresh();
    return this.state;
  }

  get isOpen(): boolean {
    return this.state === 'open';
  }

  async execute<T>(action: () => Promise<T>): Promise<T> {
    this.refresh();

    if (this.state === 'open') {
      const elapsed = Date.now() - (this.openedAt ?? Date.now());
      const retryAfter = Math.max(0, this.options.cooldownMs - elapsed);
      throw new CircuitOpenError(
        `Circuit breaker "${this.options.name ?? 'default'}" is open`,
        retryAfter,
      );
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.openedAt = null;
  }

  private refresh(): void {
    if (
      this.state === 'open' &&
      this.openedAt !== null &&
      Date.now() - this.openedAt >= this.options.cooldownMs
    ) {
      this.state = 'half-open';
      this.failures = 0;
    }
  }

  private onSuccess(): void {
    if (this.state === 'half-open') {
      this.state = 'closed';
      this.failures = 0;
      this.openedAt = null;
    } else {
      this.failures = 0;
    }
  }

  private onFailure(): void {
    this.failures += 1;
    if (this.failures >= this.options.failureThreshold) {
      this.state = 'open';
      this.openedAt = Date.now();
    }
  }
}