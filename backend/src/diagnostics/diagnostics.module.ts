import { Module } from '@nestjs/common';
import { ObdModule } from '../obd/obd.module';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { AdapterController } from './adapter.controller';
import { LiveController } from './live.controller';
import { PollerController } from './poller.controller';
import { SessionsController } from './sessions.controller';

@Module({
  imports: [ObdModule, TelemetryModule],
  controllers: [
    AdapterController,
    LiveController,
    PollerController,
    SessionsController,
  ],
})
export class DiagnosticsModule {}
