import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  async health() {
    return this.healthService.check();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check endpoint' })
  async ready() {
    return this.healthService.ready();
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Prometheus metrics' })
  async metrics() {
    return this.healthService.getMetrics();
  }
}
