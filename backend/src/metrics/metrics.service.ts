import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Counter,
  Gauge,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry = new Registry();

  private readonly httpRequestsTotal: Counter;
  private readonly httpRequestDuration: Histogram;
  private readonly obdReadSampleDuration: Histogram;
  private readonly obdCircuitBreakerOpen: Gauge;
  private readonly pollerTicksTotal: Counter;
  private readonly pollerErrorsTotal: Counter;

  constructor() {
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.obdReadSampleDuration = new Histogram({
      name: 'obd_read_sample_duration_seconds',
      help: 'Duration of OBD readSample calls in seconds',
      labelNames: ['result'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.obdCircuitBreakerOpen = new Gauge({
      name: 'obd_circuit_breaker_open',
      help: 'Whether the OBD circuit breaker is currently open (1 = open, 0 = closed)',
      registers: [this.registry],
    });

    this.pollerTicksTotal = new Counter({
      name: 'telemetry_poller_ticks_total',
      help: 'Total number of successful telemetry poll ticks',
      registers: [this.registry],
    });

    this.pollerErrorsTotal = new Counter({
      name: 'telemetry_poller_errors_total',
      help: 'Total number of failed telemetry poll ticks',
      registers: [this.registry],
    });
  }

  onModuleInit(): void {
    collectDefaultMetrics({ register: this.registry });
  }

  incrementHttpRequests(method: string, route: string, statusCode: number): void {
    this.httpRequestsTotal.inc({ method, route, status_code: statusCode });
  }

  observeHttpRequestDuration(
    method: string,
    route: string,
    statusCode: number,
    durationSec: number,
  ): void {
    this.httpRequestDuration.observe(
      { method, route, status_code: statusCode },
      durationSec,
    );
  }

  observeObdReadSample(result: 'success' | 'error', durationSec: number): void {
    this.obdReadSampleDuration.observe({ result }, durationSec);
  }

  setObdCircuitBreakerOpen(open: boolean): void {
    this.obdCircuitBreakerOpen.set(open ? 1 : 0);
  }

  incrementPollerTick(): void {
    this.pollerTicksTotal.inc();
  }

  incrementPollerError(): void {
    this.pollerErrorsTotal.inc();
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}