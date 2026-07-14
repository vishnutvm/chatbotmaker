import type {
  AddOrganizationMemberRequest,
  CreateOrganizationRequest,
  OrganizationDetail,
  OrganizationMemberDto,
  OrganizationMembersResponse,
  OrganizationsListResponse,
  UpdateOrganizationMemberRequest,
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

  listMembers(accessToken: string, organizationId: string): Promise<OrganizationMembersResponse> {
    return this.getJson<OrganizationMembersResponse>(
      `/api/v1/organizations/${organizationId}/members`,
      accessToken,
    );
  }

  addMember(
    accessToken: string,
    organizationId: string,
    body: AddOrganizationMemberRequest,
  ): Promise<OrganizationMemberDto> {
    return this.postJson<OrganizationMemberDto>(
      `/api/v1/organizations/${organizationId}/members`,
      body,
      accessToken,
    );
  }

  updateMember(
    accessToken: string,
    organizationId: string,
    userId: string,
    body: UpdateOrganizationMemberRequest,
  ): Promise<OrganizationMemberDto> {
    return this.patchJson<OrganizationMemberDto>(
      `/api/v1/organizations/${organizationId}/members/${userId}`,
      body,
      accessToken,
    );
  }

  removeMember(accessToken: string, organizationId: string, userId: string): Promise<void> {
    return this.deleteRequest(`/api/v1/organizations/${organizationId}/members/${userId}`, accessToken);
  }
}

export function createOrganizationsClient(baseUrl = 'http://localhost:4000'): GenieOrganizationsClient {
  return new GenieOrganizationsClient(baseUrl);
}
