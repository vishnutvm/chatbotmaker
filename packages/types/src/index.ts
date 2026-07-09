export type HealthStatus = 'ok' | 'degraded' | 'error';

export interface HealthResponse {
  status: HealthStatus;
  service: string;
  timestamp: string;
}

export type OrganizationRole = 'owner' | 'admin' | 'member';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthOrganization {
  id: string;
  name: string;
  slug: string;
  role: OrganizationRole;
}

export interface OnboardResponse {
  user: AuthUser;
  organization: AuthOrganization;
}

export interface MeResponse {
  user: AuthUser;
  organizations: AuthOrganization[];
}

export * from './assistant';
export * from './knowledge';
export * from './conversation';
export * from './analytics';
