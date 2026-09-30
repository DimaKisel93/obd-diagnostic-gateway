import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Elm327Adapter } from './adapters/elm327.adapter';
import { MockElm327Adapter } from './adapters/mock-elm327.adapter';
import { OBD_ADAPTER } from './interfaces/obd-adapter.interface';
import { ObdController } from './obd.controller';
import { ObdService } from './obd.service';

@Module({
  imports: [ConfigModule],
  controllers: [ObdController],
  providers: [
    MockElm327Adapter,
    Elm327Adapter,
    {
      provide: OBD_ADAPTER,
      inject: [ConfigService, MockElm327Adapter, Elm327Adapter],
      useFactory: (
        config: ConfigService,
        mock: MockElm327Adapter,
        elm327: Elm327Adapter,
      ) => {
        const mode = (config.get<string>('OBD_ADAPTER') ?? 'mock').toLowerCase();
        return mode === 'elm327' ? elm327 : mock;
      },
    },
    ObdService,
  ],
  exports: [ObdService, OBD_ADAPTER],
})
export class ObdModule {}
