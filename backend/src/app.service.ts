import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'obd-diagnostic-gateway',
      version: '0.1.0',
    };
  }
}
