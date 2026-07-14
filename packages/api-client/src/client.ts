import type { HealthResponse, VersionResponse } from '@genie/types';

export class GenieApiClient {
  constructor(private readonly baseUrl: string) {}

  getBaseUrl(): string {
    return this.baseUrl.replace(/\/$/, '');
  }

  protected async requestJson<T>(
    path: string,
    init: RequestInit = {},
    accessToken?: string,
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.getBaseUrl()}${path}`, {
        ...init,
        headers: {
          ...(init.headers ?? {}),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });
    } catch {
      throw new Error(
        'Network error — could not reach the API. Check NEXT_PUBLIC_API_URL and server CORS_ORIGINS.',
      );
    }

    if (!response.ok) {
      const text = await response.text();
      let message = text || `Request failed: ${response.status}`;
      try {
        const parsed = JSON.parse(text) as { message?: string | string[] };
        if (parsed.message) {
          message = Array.isArray(parsed.message) ? parsed.message.join(', ') : parsed.message;
        }
      } catch {
        // keep raw text
      }
      throw new Error(message);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    return JSON.parse(text) as T;
  }

  protected async postJson<T>(path: string, body: unknown, accessToken?: string): Promise<T> {
    return this.requestJson<T>(
      path,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      accessToken,
    );
  }

  protected async getJson<T>(path: string, accessToken?: string): Promise<T> {
    return this.requestJson<T>(path, { method: 'GET' }, accessToken);
  }

  protected async patchJson<T>(path: string, body: unknown, accessToken?: string): Promise<T> {
    return this.requestJson<T>(
      path,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      accessToken,
    );
  }

  protected async deleteRequest(path: string, accessToken?: string): Promise<void> {
    await this.requestJson<unknown>(path, { method: 'DELETE' }, accessToken);
  }

  async getHealth(): Promise<HealthResponse> {
    return this.getJson<HealthResponse>('/health');
  }

  async getVersion(): Promise<VersionResponse> {
    return this.getJson<VersionResponse>('/version');
  }
}
