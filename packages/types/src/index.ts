export type HealthStatus = 'ok' | 'degraded' | 'error';

export interface HealthResponse {
  status: HealthStatus;
  service: string;
  timestamp: string;
}

export interface VersionResponse {
  service: string;
  version: string;
  gitSha: string;
  gitShaShort: string;
  environment: string;
  nodeEnv: string;
  timestamp: string;
}

export type { OrganizationRole } from './organization';
import type { OrganizationRole } from './organization';

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

export * from './organization';
export * from './assistant';
export * from './knowledge';
export * from './conversation';
export * from './analytics';
