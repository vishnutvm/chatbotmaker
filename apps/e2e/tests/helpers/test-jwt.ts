import { randomUUID } from 'crypto';
import { sign } from 'jsonwebtoken';
import { readEnv } from './env';

/** Must match CI `SUPABASE_JWT_SECRET` / `E2E_JWT_SECRET` and playwright apiServerEnv. */
export const CI_JWT_SECRET = 'ci-test-jwt-secret-minimum-32-characters';

export function getTestJwtSecret(): string {
  return readEnv('E2E_JWT_SECRET') ?? readEnv('SUPABASE_JWT_SECRET') ?? CI_JWT_SECRET;
}

/** Hosted Supabase URL → API verifies via JWKS (and HS256 dual-mode when secret is set). */
export function isApiJwksMode(): boolean {
  const url = readEnv('E2E_API_SUPABASE_URL') ?? readEnv('SUPABASE_URL') ?? 'http://127.0.0.1:54321';
  const normalized = url.replace(/\/$/, '');
  if (!normalized.startsWith('https://')) {
    return false;
  }
  return !normalized.includes('127.0.0.1') && !normalized.includes('localhost');
}

export function isSupabaseConfiguredForE2E(): boolean {
  return Boolean(readEnv('E2E_SUPABASE_URL') && readEnv('E2E_SUPABASE_ANON_KEY'));
}

function getTestJwtIssuer(): string | undefined {
  if (!isApiJwksMode()) {
    return undefined;
  }
  const url = (readEnv('E2E_API_SUPABASE_URL') ?? readEnv('SUPABASE_URL') ?? '').replace(/\/$/, '');
  return url ? `${url}/auth/v1` : undefined;
}

export function signTestJwt(payload: { sub?: string; email?: string } = {}): {
  token: string;
  supabaseUserId: string;
  email: string;
} {
  const supabaseUserId = payload.sub ?? randomUUID();
  const email = payload.email ?? `e2e-${supabaseUserId}@example.com`;
  const issuer = getTestJwtIssuer();

  const token = sign(
    {
      sub: supabaseUserId,
      email,
      role: 'authenticated',
      aud: 'authenticated',
      ...(issuer ? { iss: issuer } : {}),
    },
    getTestJwtSecret(),
    { expiresIn: '1h', algorithm: 'HS256' },
  );

  return { token, supabaseUserId, email };
}
