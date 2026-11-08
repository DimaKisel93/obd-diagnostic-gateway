import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DiagnosticsModule } from './diagnostics/diagnostics.module';
import { ObdModule } from './obd/obd.module';
import { PrismaModule } from './prisma/prisma.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { validateEnv } from './env/env-validator';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    PrismaModule,
    ObdModule,
    TelemetryModule,
    DiagnosticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
