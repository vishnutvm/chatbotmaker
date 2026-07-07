export interface AccessTokenPayload {
  sub: string;
  email: string;
  organizationId: string;
  role: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  jti: string;
}
