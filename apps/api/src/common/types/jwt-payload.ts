/** Claims from a validated Supabase JWT */
export interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  aud?: string;
  role?: string;
}

/** Identity from Supabase JWT only (no application user lookup) */
export interface SupabaseIdentity {
  supabaseUserId: string;
  email: string;
}

/** Enriched user context attached after JWT validation + DB lookup */
export interface AuthenticatedUser {
  supabaseUserId: string;
  userId: string;
  email: string;
}
