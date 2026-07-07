import type { AuthResponse, MeResponse } from '@genie/types';
import { GenieApiClient } from './client';

export class GenieAuthClient extends GenieApiClient {
  async signup(body: {
    email: string;
    password: string;
    name: string;
    organizationName?: string;
  }): Promise<AuthResponse> {
    return this.postJson<AuthResponse>('/api/v1/auth/signup', body);
  }

  async login(body: { email: string; password: string }): Promise<AuthResponse> {
    return this.postJson<AuthResponse>('/api/v1/auth/login', body);
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    return this.postJson<AuthResponse>('/api/v1/auth/refresh', { refreshToken });
  }

  async me(accessToken: string): Promise<MeResponse> {
    return this.getJson<MeResponse>('/api/v1/auth/me', accessToken);
  }

  async logout(accessToken: string, refreshToken: string): Promise<void> {
    const response = await fetch(`${this.getBaseUrl()}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok && response.status !== 204) {
      throw new Error(`Logout failed: ${response.status}`);
    }
  }
}
