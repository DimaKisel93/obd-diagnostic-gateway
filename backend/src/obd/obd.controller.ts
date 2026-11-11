import {
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { ObdService } from './obd.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  SWAGGER_ADAPTER_STATUS_SUMMARY,
  SWAGGER_ADAPTER_STATUS_DESCRIPTION,
  SWAGGER_CONNECT_SUMMARY,
  SWAGGER_CONNECTION_ESTABLISHED_DESCRIPTION,
  SWAGGER_DISCONNECT_SUMMARY,
  SWAGGER_DISCONNECTED_DESCRIPTION,
  SWAGGER_OBD_SAMPLE_SUMMARY,
  SWAGGER_OBD_SAMPLE_DESCRIPTION,
} from '../common/constants/swagger';

@Controller('obd')
@ApiTags('obd')
export class ObdController {
  constructor(private readonly obdService: ObdService) {}

  @Get('status')
  @ApiOperation({ summary: SWAGGER_ADAPTER_STATUS_SUMMARY })
  @ApiResponse({ status: 200, description: SWAGGER_ADAPTER_STATUS_DESCRIPTION })
  getStatus() {
    return this.obdService.getStatus();
  }

  @Post('connect')
  @ApiOperation({ summary: SWAGGER_CONNECT_SUMMARY })
  @ApiResponse({ status: 200, description: SWAGGER_CONNECTION_ESTABLISHED_DESCRIPTION })
  connect() {
    return this.obdService.connect();
  }

  @Post('disconnect')
  @ApiOperation({ summary: SWAGGER_DISCONNECT_SUMMARY })
  @ApiResponse({ status: 200, description: SWAGGER_DISCONNECTED_DESCRIPTION })
  disconnect() {
    return this.obdService.disconnect();
  }

  @Get('sample')
  @ApiOperation({ summary: SWAGGER_OBD_SAMPLE_SUMMARY })
  @ApiResponse({ status: 200, description: SWAGGER_OBD_SAMPLE_DESCRIPTION })
  sample(@Query('pids') pids?: string) {
    const parsed = pids?.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    return this.obdService.readSample(parsed && parsed.length ? parsed : undefined);
  }
}
