import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SWAGGER_SUMMARIES, SWAGGER_DESCRIPTIONS } from './common/constants/swagger';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiTags('health')
  @ApiOperation({ summary: SWAGGER_SUMMARIES.HEALTH_CHECK })
  @ApiResponse({ status: 200, description: SWAGGER_DESCRIPTIONS.HEALTH_CHECK_RESULT })
  async getHealth() {
    return this.appService.getHealth();
  }
}

