import type { Algorithm } from 'jsonwebtoken';
import { passportJwtSecret } from 'jwks-rsa';
import { getSupabaseJwtSecret, getSupabaseUrl } from '../../../config/env';

const JWKS_ALGORITHMS: Algorithm[] = ['ES256', 'RS256'];
const SECRET_ALGORITHMS: Algorithm[] = ['HS256'];

/** Hosted Supabase issues asymmetric JWTs — verify via JWKS, not legacy HS256 secret. */
function shouldUseJwks(supabaseUrl: string): boolean {
  if (!supabaseUrl.startsWith('https://')) {
    return false;
  }
  // Local/staging https proxies still use shared secret in dev
  if (supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost')) {
    return false;
  }
  return true;
}

export function buildSupabaseJwtStrategyOptions() {
  const supabaseUrl = getSupabaseUrl();
  const useJwks = shouldUseJwks(supabaseUrl);

  return {
    ignoreExpiration: false,
    ...(useJwks
      ? {
          secretOrKeyProvider: passportJwtSecret({
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 5,
            jwksUri: `${supabaseUrl.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`,
          }),
          algorithms: JWKS_ALGORITHMS,
        }
      : {
          secretOrKey: getSupabaseJwtSecret(),
          algorithms: SECRET_ALGORITHMS,
        }),
  };
}