import { Controller, Get } from '@nestjs/common';
import type { HealthResponse, VersionResponse } from '@genie/types';
import { buildVersionPayload } from '../config/version';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  getHealth(): HealthResponse {
    return this.healthService.getHealth();
  }

  @Get('version')
  getVersion(): VersionResponse {
    return buildVersionPayload({
      service: 'genie-api',
      version:
        process.env.APP_VERSION ||
        process.env.npm_package_version ||
        '0.2.1',
    });
  }
}
