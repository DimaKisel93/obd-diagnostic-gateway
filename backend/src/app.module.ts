import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DiagnosticsModule } from './diagnostics/diagnostics.module';
import { ObdModule } from './obd/obd.module';
import { PrismaModule } from './prisma/prisma.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { validateEnv } from './env/env-validator';
import { HttpThrottlerGuard } from './common/guards/http-throttler.guard';
import { RATE_LIMIT_DEFAULTS } from './common/constants/rate-limit';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: Number(
              config.get('THROTTLE_TTL_MS', String(RATE_LIMIT_DEFAULTS.THROTTLE_TTL_MS)),
            ),
            limit: Number(
              config.get('THROTTLE_LIMIT', String(RATE_LIMIT_DEFAULTS.THROTTLE_LIMIT)),
            ),
          },
        ],
        errorMessage: 'Too Many Requests',
        setHeaders: true,
      }),
    }),
    PrismaModule,
    ObdModule,
    TelemetryModule,
    DiagnosticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: HttpThrottlerGuard },
  ],
})
export class AppModule {}
