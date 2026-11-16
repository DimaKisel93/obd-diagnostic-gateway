import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService();
  });

  it('registers default metrics on init', async () => {
    service.onModuleInit();
    const metrics = await service.getMetrics();
    expect(metrics).toContain('process_cpu_user_seconds_total');
  });

  it('counts http requests by method/route/status', async () => {
    service.incrementHttpRequests('GET', '/api/health', 200);
    service.incrementHttpRequests('GET', '/api/health', 200);
    service.incrementHttpRequests('POST', '/api/adapter', 500);

    const metrics = await service.getMetrics();
    expect(metrics).toContain('http_requests_total{method="GET",route="/api/health",status_code="200"} 2');
    expect(metrics).toContain('http_requests_total{method="POST",route="/api/adapter",status_code="500"} 1');
  });

  it('observes http request duration', async () => {
    service.observeHttpRequestDuration('GET', '/api/health', 200, 0.05);

    const metrics = await service.getMetrics();
    expect(metrics).toContain('http_request_duration_seconds_bucket');
  });

  it('observes obd read sample duration by result', async () => {
    service.observeObdReadSample('success', 0.01);
    service.observeObdReadSample('error', 0.02);

    const metrics = await service.getMetrics();
    expect(metrics).toContain('obd_read_sample_duration_seconds_bucket{le="0.005",result="success"} 0');
    expect(metrics).toContain('obd_read_sample_duration_seconds_bucket{le="0.025",result="error"} 1');
  });

  it('exposes circuit breaker open gauge', async () => {
    service.setObdCircuitBreakerOpen(true);
    let metrics = await service.getMetrics();
    expect(metrics).toContain('obd_circuit_breaker_open 1');

    service.setObdCircuitBreakerOpen(false);
    metrics = await service.getMetrics();
    expect(metrics).toContain('obd_circuit_breaker_open 0');
  });

  it('counts poller ticks and errors', async () => {
    service.incrementPollerTick();
    service.incrementPollerTick();
    service.incrementPollerError();

    const metrics = await service.getMetrics();
    expect(metrics).toContain('telemetry_poller_ticks_total 2');
    expect(metrics).toContain('telemetry_poller_errors_total 1');
  });

  it('returns prometheus content type', () => {
    expect(service.getContentType()).toContain('text/plain');
  });
});