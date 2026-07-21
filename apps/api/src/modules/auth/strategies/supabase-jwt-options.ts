import jwt, { type Algorithm } from 'jsonwebtoken';
import { passportJwtSecret } from 'jwks-rsa';
import { getSupabaseJwtSecret, getSupabaseUrl } from '../../../config/env';

const JWKS_ALGORITHMS: Algorithm[] = ['ES256', 'RS256'];
const SECRET_ALGORITHMS: Algorithm[] = ['HS256'];

type JwtSecretOrKeyProvider = (
  request: unknown,
  rawJwtToken: string,
  done: (err: Error | null, secretOrKey?: string | Buffer) => void,
) => void;

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

/** Explicit env only — never the local default — so prod JWKS hosts are not dual-mode by accident. */
function getExplicitHs256Secret(): string | undefined {
  const value = process.env.SUPABASE_JWT_SECRET?.trim();
  return value || undefined;
}

/**
 * Passport JWT options for Supabase tokens.
 *
 * Hosted projects verify ES256/RS256 via JWKS. When `SUPABASE_JWT_SECRET` is explicitly set
 * (CI), HS256 synthetic tokens are also accepted so E2E `signTestJwt` works alongside real
 * auth-flow sessions. Production hosted setups should leave `SUPABASE_JWT_SECRET` unset.
 */
export function buildSupabaseJwtStrategyOptions() {
  const supabaseUrl = normalizeSupabaseUrl(getSupabaseUrl());
  const useJwks = shouldUseJwks(supabaseUrl);
  const explicitHs256Secret = getExplicitHs256Secret();

  if (!useJwks) {
    return {
      ignoreExpiration: false,
      secretOrKey: getSupabaseJwtSecret(),
      algorithms: SECRET_ALGORITHMS,
    };
  }

  const jwksProvider = passportJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
  });

  if (!explicitHs256Secret) {
    return {
      ignoreExpiration: false,
      secretOrKeyProvider: jwksProvider,
      algorithms: JWKS_ALGORITHMS,
      issuer: getSupabaseJwtIssuer(supabaseUrl),
      audience: 'authenticated',
    };
  }

  const secretOrKeyProvider: JwtSecretOrKeyProvider = (_request, rawJwtToken, done) => {
    try {
      const decoded = jwt.decode(rawJwtToken, { complete: true });
      if (decoded?.header?.alg === 'HS256') {
        done(null, explicitHs256Secret);
        return;
      }
    } catch {
      // Fall through to JWKS
    }
    jwksProvider(_request, rawJwtToken, done);
  };

  return {
    ignoreExpiration: false,
    secretOrKeyProvider,
    algorithms: [...JWKS_ALGORITHMS, ...SECRET_ALGORITHMS],
    issuer: getSupabaseJwtIssuer(supabaseUrl),
    audience: 'authenticated',
  };
}
