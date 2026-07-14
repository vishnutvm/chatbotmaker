export type OrganizationRole = 'owner' | 'admin' | 'member';

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  role: OrganizationRole;
  plan: string;
  createdAt: string;
}

export interface OrganizationDetail extends OrganizationSummary {
  ownerId: string;
  updatedAt: string;
}

export interface OrganizationsListResponse {
  organizations: OrganizationSummary[];
}

export interface CreateOrganizationRequest {
  name: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
}
