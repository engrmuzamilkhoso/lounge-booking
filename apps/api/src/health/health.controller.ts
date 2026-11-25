import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthService, type HealthStatus } from './health.service.js';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check that the API and its database connection are working' })
  getHealth(): Promise<HealthStatus> {
    return this.healthService.getStatus();
  }
}
