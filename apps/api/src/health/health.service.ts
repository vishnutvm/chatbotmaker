import { Injectable } from '@nestjs/common';
import type { HealthResponse } from '@genie/types';

@Injectable()
export class HealthService {
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'genie-api',
      timestamp: new Date().toISOString(),
    };
  }
}
