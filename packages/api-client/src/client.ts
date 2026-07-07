import type { HealthResponse } from '@genie/types';

export class GenieApiClient {
  constructor(private readonly baseUrl: string) {}

  getBaseUrl(): string {
    return this.baseUrl.replace(/\/$/, '');
  }

  protected async postJson<T>(path: string, body: unknown, accessToken?: string): Promise<T> {
    const response = await fetch(`${this.getBaseUrl()}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed: ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  protected async getJson<T>(path: string, accessToken?: string): Promise<T> {
    const response = await fetch(`${this.getBaseUrl()}${path}`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  async getHealth(): Promise<HealthResponse> {
    return this.getJson<HealthResponse>('/health');
  }
}
