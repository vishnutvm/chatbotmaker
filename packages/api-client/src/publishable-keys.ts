import type {
  CreatePublicKeyRequest,
  PublicKeyCreatedDto,
  PublicKeyDto,
  PublicKeysListResponse,
} from '@genie/types';
import { GenieApiClient } from './client';

/** Org-scoped publishable keys for widget embed auth. */
export class GeniePublishableKeysClient extends GenieApiClient {
  list(accessToken: string, organizationId: string): Promise<PublicKeysListResponse> {
    return this.getJson<PublicKeysListResponse>(
      `/api/v1/organizations/${organizationId}/public-keys`,
      accessToken,
    );
  }

  create(
    accessToken: string,
    organizationId: string,
    body: CreatePublicKeyRequest = {},
  ): Promise<PublicKeyCreatedDto> {
    return this.postJson<PublicKeyCreatedDto>(
      `/api/v1/organizations/${organizationId}/public-keys`,
      body,
      accessToken,
    );
  }

  revoke(
    accessToken: string,
    organizationId: string,
    keyId: string,
  ): Promise<PublicKeyDto> {
    return this.postJson<PublicKeyDto>(
      `/api/v1/organizations/${organizationId}/public-keys/${keyId}/revoke`,
      {},
      accessToken,
    );
  }
}

export function createPublishableKeysClient(baseUrl?: string): GeniePublishableKeysClient {
  return new GeniePublishableKeysClient(baseUrl ?? 'http://localhost:4000');
}
