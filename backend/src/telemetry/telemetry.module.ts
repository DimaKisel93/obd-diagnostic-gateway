import { Module } from '@nestjs/common';
import { ObdModule } from '../obd/obd.module';
import { TelemetryController } from './telemetry.controller';
import { TelemetryPollerService } from './telemetry-poller.service';
import { TelemetryService } from './telemetry.service';

@Module({
  imports: [ObdModule],
  controllers: [TelemetryController],
  providers: [TelemetryService, TelemetryPollerService],
  exports: [TelemetryService, TelemetryPollerService],
})
export class TelemetryModule {}
