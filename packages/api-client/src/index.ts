import type { HealthResponse } from '@genie/types';

export class GenieApiClient {
  constructor(private readonly baseUrl: string) {}

  async getHealth(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return response.json() as Promise<HealthResponse>;
  }
}

export function createApiClient(baseUrl = 'http://localhost:4000'): GenieApiClient {
  return new GenieApiClient(baseUrl);
}
