import { LoggerService, LogLevel } from '@nestjs/common';
import * as winston from 'winston';

type OptionalParamsForMethod<T extends (...args: any[]) => void> = 
  T extends (msg: any, ...rest: infer R) => void ? R : any[];

type LogMessage = string | Error | unknown;

type ParsedOptionalResult = {
  context?: string;
  meta: Record<string, unknown>;
};

const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.json(),
);

const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: jsonFormat,
  defaultMeta: { service: 'obd-diagnostic-gateway' },
  transports: [
    new winston.transports.Console({
      format: jsonFormat,
    }),
  ],
});

export class StructuredLogger implements LoggerService {
  private readonly context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  setLogLevels?(levels: LogLevel[]): void {
    winstonLogger.level = levels[levels.length - 1] || 'info';
  }

  log(message: LogMessage, ...optionalParams: OptionalParamsForMethod<(msg: LogMessage, ...rest: any[]) => void>): void {
    const parsed = this.parseOptional(message, optionalParams);
    winstonLogger.info(this.formatMessage(message), {
      context: parsed.context ?? this.context,
      ...parsed.meta,
    });
  }

  error(message: LogMessage, stack?: string, context?: string): void {
    winstonLogger.error(this.formatMessage(message), {
      context: context ?? this.context,
      stack,
    });
  }

  warn(message: LogMessage, ...optionalParams: OptionalParamsForMethod<(msg: LogMessage, ...rest: any[]) => void>): void {
    const parsed = this.parseOptional(message, optionalParams);
    winstonLogger.warn(this.formatMessage(message), {
      context: parsed.context ?? this.context,
      ...parsed.meta,
    });
  }

  debug(message: LogMessage, ...optionalParams: OptionalParamsForMethod<(msg: LogMessage, ...rest: any[]) => void>): void {
    const parsed = this.parseOptional(message, optionalParams);
    winstonLogger.debug(this.formatMessage(message), {
      context: parsed.context ?? this.context,
      ...parsed.meta,
    });
  }

  verbose(message: LogMessage, ...optionalParams: OptionalParamsForMethod<(msg: LogMessage, ) => void>): void {
    const parsed = this.parseOptional(message, optionalParams);
    winstonLogger.verbose(this.formatMessage(message), {
      context: parsed.context ?? this.context,
      ...parsed.meta,
    });
  }

  fatal(message: LogMessage, ...optionalParams: OptionalParamsForMethod<(msg: LogMessage, ...rest: any[]) => void>): void {
    const parsed = this.parseOptional(message, optionalParams);
    winstonLogger.error(this.formatMessage(message), {
      context: parsed.context ?? this.context,
      ...parsed.meta,
    });
  }

  private parseOptional(
    message: LogMessage,
    optionalParams: unknown[]
  ): ParsedOptionalResult {
    const result: ParsedOptionalResult = { meta: {} };
    
    if (optionalParams.length === 0) {
      return result;
    }
    
    const last = optionalParams[optionalParams.length - 1];
    if (typeof last === 'string') {
      result.context = last;
    } else if (last && typeof last === 'object' && !Array.isArray(last)) {
      result.meta = last as Record<string, unknown>;
    }
    
    return result;
  }

  private formatMessage(message: LogMessage): string {
    if (typeof message === 'string') {
      return message;
    }
    if (message instanceof Error) {
      return message.message;
    }
    return JSON.stringify(message);
  }
}

export const createStructuredLogger = (context?: string): LoggerService => {
  return new StructuredLogger(context);
};