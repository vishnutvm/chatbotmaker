import type {
  CreateOrganizationRequest,
  OrganizationDetail,
  OrganizationsListResponse,
  UpdateOrganizationRequest,
} from '@genie/types';
import { GenieApiClient } from './client';

export class GenieOrganizationsClient extends GenieApiClient {
  list(accessToken: string): Promise<OrganizationsListResponse> {
    return this.getJson<OrganizationsListResponse>('/api/v1/organizations', accessToken);
  }

  create(accessToken: string, body: CreateOrganizationRequest): Promise<OrganizationDetail> {
    return this.postJson<OrganizationDetail>('/api/v1/organizations', body, accessToken);
  }

  get(accessToken: string, organizationId: string): Promise<OrganizationDetail> {
    return this.getJson<OrganizationDetail>(`/api/v1/organizations/${organizationId}`, accessToken);
  }

  update(
    accessToken: string,
    organizationId: string,
    body: UpdateOrganizationRequest,
  ): Promise<OrganizationDetail> {
    return this.patchJson<OrganizationDetail>(
      `/api/v1/organizations/${organizationId}`,
      body,
      accessToken,
    );
  }
}

export function createOrganizationsClient(baseUrl = 'http://localhost:4000'): GenieOrganizationsClient {
  return new GenieOrganizationsClient(baseUrl);
}
