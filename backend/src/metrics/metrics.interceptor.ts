import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MetricsService } from './metrics.service';
import { Request, Response } from 'express';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    if (!req || !res) {
      return next.handle();
    }

    const start = process.hrtime.bigint();

    return next.handle().pipe(
      finalize(() => {
        const durationSec = Number(process.hrtime.bigint() - start) / 1e9;
        const route = req.route?.path ?? req.url;
        const status = res.statusCode;

        this.metrics.incrementHttpRequests(req.method, route, status);
        this.metrics.observeHttpRequestDuration(req.method, route, status, durationSec);
      }),
    );
  }
}