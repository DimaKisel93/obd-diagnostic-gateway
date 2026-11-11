import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  SWAGGER_QUERY_LIMIT_DESCRIPTION,
  SWAGGER_QUERY_PID_DESCRIPTION,
} from '../../common/constants/swagger';

export class LatestQueryDto {
  @ApiPropertyOptional({
    description: SWAGGER_QUERY_LIMIT_DESCRIPTION,
    default: 20,
    minimum: 1,
    maximum: 200,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: SWAGGER_QUERY_PID_DESCRIPTION,
    example: '0C',
    type: String,
  })
  @IsOptional()
  @IsString()
  pid?: string;
}