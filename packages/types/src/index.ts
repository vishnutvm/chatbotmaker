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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: AuthUser;
  organization: AuthOrganization;
  tokens: AuthTokens;
}

export interface MeResponse {
  user: AuthUser;
  organizations: AuthOrganization[];
}
