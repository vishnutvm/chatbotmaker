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

export interface OrganizationMemberDto {
  userId: string;
  email: string;
  name: string;
  role: OrganizationRole;
  createdAt: string;
}

export interface OrganizationsListResponse {
  organizations: OrganizationSummary[];
}

export interface OrganizationMembersResponse {
  members: OrganizationMemberDto[];
}

export interface OrganizationInvitationDto {
  id: string;
  organizationId: string;
  email: string;
  role: Exclude<OrganizationRole, 'owner'>;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expiresAt: string;
  createdAt: string;
  inviteUrl: string;
}

export interface OrganizationInvitationsResponse {
  invitations: OrganizationInvitationDto[];
}

export type InviteMemberResponse =
  | { status: 'added'; member: OrganizationMemberDto }
  | { status: 'invited'; invitation: OrganizationInvitationDto };

export interface AcceptInvitationRequest {
  token: string;
}

export interface CreateOrganizationRequest {
  name: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
}

export interface AddOrganizationMemberRequest {
  email: string;
  role?: Exclude<OrganizationRole, 'owner'>;
}

export interface UpdateOrganizationMemberRequest {
  role: Exclude<OrganizationRole, 'owner'>;
}
