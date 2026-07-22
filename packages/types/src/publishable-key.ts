export interface PublicKeyDto {
  id: string;
  organizationId: string;
  name: string;
  keyPrefix: string;
  createdById: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

/** Create response — includes plaintext `key` once. */
export interface PublicKeyCreatedDto extends PublicKeyDto {
  key: string;
}

export interface PublicKeysListResponse {
  keys: PublicKeyDto[];
}

export interface CreatePublicKeyRequest {
  name?: string;
}

export interface WidgetBootstrapDto {
  assistantId: string;
  organizationId: string;
  name: string;
  welcomeMessage: string;
  appearance: Record<string, unknown>;
}
