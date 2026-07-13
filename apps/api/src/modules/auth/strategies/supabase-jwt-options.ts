import type { Algorithm } from 'jsonwebtoken';
import { passportJwtSecret } from 'jwks-rsa';
import { getSupabaseJwtSecret, getSupabaseUrl } from '../../../config/env';

const JWKS_ALGORITHMS: Algorithm[] = ['ES256', 'RS256'];
const SECRET_ALGORITHMS: Algorithm[] = ['HS256'];

/** Hosted Supabase issues asymmetric JWTs — verify via JWKS, not legacy HS256 secret. */
export function shouldUseJwks(supabaseUrl: string): boolean {
  if (!supabaseUrl.startsWith('https://')) {
    return false;
  }
  // Local/staging https proxies still use shared secret in dev
  if (supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost')) {
    return false;
  }
  return true;
}

function normalizeSupabaseUrl(supabaseUrl: string): string {
  return supabaseUrl.replace(/\/$/, '');
}

export function getSupabaseJwtIssuer(supabaseUrl: string): string {
  return `${normalizeSupabaseUrl(supabaseUrl)}/auth/v1`;
}

export function buildSupabaseJwtStrategyOptions() {
  const supabaseUrl = normalizeSupabaseUrl(getSupabaseUrl());
  const useJwks = shouldUseJwks(supabaseUrl);

  return {
    ignoreExpiration: false,
    ...(useJwks
      ? {
          secretOrKeyProvider: passportJwtSecret({
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 5,
            jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
          }),
          algorithms: JWKS_ALGORITHMS,
          issuer: getSupabaseJwtIssuer(supabaseUrl),
          audience: 'authenticated',
        }
      : {
          secretOrKey: getSupabaseJwtSecret(),
          algorithms: SECRET_ALGORITHMS,
        }),
  };
}