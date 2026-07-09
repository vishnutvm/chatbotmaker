import type { Algorithm } from 'jsonwebtoken';
import { passportJwtSecret } from 'jwks-rsa';
import { getSupabaseJwtSecret, getSupabaseUrl } from '../../../config/env';

const JWKS_ALGORITHMS: Algorithm[] = ['ES256', 'RS256'];
const SECRET_ALGORITHMS: Algorithm[] = ['HS256', 'ES256', 'RS256'];

export function buildSupabaseJwtStrategyOptions() {
  const supabaseUrl = getSupabaseUrl();
  const jwtSecret = getSupabaseJwtSecret();
  const useJwks = supabaseUrl.startsWith('https://') && !process.env.SUPABASE_JWT_SECRET;

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
        }
      : {
          secretOrKey: jwtSecret,
          algorithms: SECRET_ALGORITHMS,
        }),
  };
}
