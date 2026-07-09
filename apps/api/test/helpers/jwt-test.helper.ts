import { sign } from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const CI_JWT_SECRET = 'ci-test-jwt-secret-minimum-32-characters';

export function getTestJwtSecret(): string {
  return process.env.SUPABASE_JWT_SECRET ?? CI_JWT_SECRET;
}

export function signTestSupabaseJwt(payload: {
  sub?: string;
  email?: string;
}): { token: string; supabaseUserId: string; email: string } {
  const supabaseUserId = payload.sub ?? randomUUID();
  const email = payload.email ?? `test-${supabaseUserId}@example.com`;

  const token = sign(
    {
      sub: supabaseUserId,
      email,
      role: 'authenticated',
      aud: 'authenticated',
    },
    getTestJwtSecret(),
    { expiresIn: '1h', algorithm: 'HS256' },
  );

  return { token, supabaseUserId, email };
}
