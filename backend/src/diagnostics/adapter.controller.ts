import { Body, Controller, Get, Post } from '@nestjs/common';
import { ObdService } from '../obd/obd.service';
import { TelemetryPollerService } from '../telemetry/telemetry-poller.service';
import { AdapterModeService, AdapterMode } from '../obd/services/adapter-mode.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  SWAGGER_ADAPTER_STATUS_SUMMARY,
  SWAGGER_ADAPTER_STATUS_DESCRIPTION,
  SWAGGER_ADAPTER_MODE_SUMMARY,
  SWAGGER_MODE_DESCRIPTION,
  SWAGGER_SET_MODE_SUMMARY,
  SWAGGER_MODE_UPDATED_DESCRIPTION,
  SWAGGER_CONNECT_SUMMARY,
  SWAGGER_CONNECTION_ESTABLISHED_DESCRIPTION,
  SWAGGER_DISCONNECT_SUMMARY,
  SWAGGER_DISCONNECTED_DESCRIPTION,
} from '../common/constants/swagger';

@Controller('adapter')
export class AdapterController {
  constructor(
    private readonly obd: ObdService,
    private readonly poller: TelemetryPollerService,
    private readonly adapterModeService: AdapterModeService,
  ) {}

  @Get()
  @ApiTags('adapter')
  @ApiOperation({ summary: SWAGGER_ADAPTER_STATUS_SUMMARY })
  @ApiResponse({ status: 200, description: SWAGGER_ADAPTER_STATUS_DESCRIPTION })
  async status() {
    return {
      ...this.obd.getStatus(),
      poller: this.poller.getStatus(),
      mode: this.adapterModeService.getCurrentMode(),
    };
  }

  @Get('mode')
  @ApiTags('adapter')
  @ApiOperation({ summary: SWAGGER_ADAPTER_MODE_SUMMARY })
  @ApiResponse({ status: 200, description: SWAGGER_MODE_DESCRIPTION })
  async getMode() {
    return { mode: this.adapterModeService.getCurrentMode() };
  }

  @Post('mode')
  @ApiTags('adapter')
  @ApiOperation({ summary: SWAGGER_SET_MODE_SUMMARY })
  @ApiResponse({ status: 200, description: SWAGGER_MODE_UPDATED_DESCRIPTION })
  async setMode(@Body() body: { mode: AdapterMode }) {
    if (body.mode !== 'mock' && body.mode !== 'elm327') {
      return { error: 'Invalid mode. Use "mock" or "elm327".' };
    }
    this.adapterModeService.setMode(body.mode);
    return { mode: this.adapterModeService.getCurrentMode() };
  }

  @Post('connect')
  @ApiTags('adapter')
  @ApiOperation({ summary: SWAGGER_CONNECT_SUMMARY })
  @ApiResponse({ status: 200, description: SWAGGER_CONNECTION_ESTABLISHED_DESCRIPTION })
  async connect() {
    return this.obd.connect();
  }

  @Post('disconnect')
  @ApiTags('adapter')
  @ApiOperation({ summary: SWAGGER_DISCONNECT_SUMMARY })
  @ApiResponse({ status: 200, description: SWAGGER_DISCONNECTED_DESCRIPTION })
  async disconnect() {
    return this.obd.disconnect();
  }
}

