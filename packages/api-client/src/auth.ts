import type { MeResponse, OnboardResponse } from '@genie/types';
import { GenieApiClient } from './client';

export class GenieAuthClient extends GenieApiClient {
  async onboard(
    accessToken: string,
    body: { name: string; email?: string; organizationName?: string },
  ): Promise<OnboardResponse> {
    return this.postJson<OnboardResponse>('/api/v1/auth/onboard', body, accessToken);
  }

  async me(accessToken: string): Promise<MeResponse> {
    return this.getJson<MeResponse>('/api/v1/auth/me', accessToken);
  }

  async session(accessToken: string): Promise<{ onboarded: boolean } & Partial<MeResponse>> {
    return this.getJson<{ onboarded: boolean } & Partial<MeResponse>>(
      '/api/v1/auth/session',
      accessToken,
    );
  }
}
