import { test, expect } from '@playwright/test';
import { expectApiStatus } from './helpers/api-response';
import { createSupabaseAccessToken, signOutSupabase } from './helpers/supabase-session';
import { isApiJwksMode, isSupabaseConfiguredForE2E, signTestJwt } from './helpers/test-jwt';

const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:4000';

async function obtainBearerToken(unique: number): Promise<{ token: string; email: string }> {
  const email = `api-e2e-${unique}@example.com`;

  if (isApiJwksMode()) {
    if (!isSupabaseConfiguredForE2E()) {
      throw new Error(
        'API is in JWKS mode (hosted Supabase) but E2E_SUPABASE_URL / E2E_SUPABASE_ANON_KEY are missing. ' +
          'Set E2E_API_SUPABASE_URL=http://127.0.0.1:54321 for HS256-only API tests, or provide Supabase secrets.',
      );
    }
    const password = `E2eApi!${unique}`;
    const { token } = await createSupabaseAccessToken(email, password);
    return { token, email };
  }

  const { token } = signTestJwt({ email });
  return { token, email };
}

test.describe('Auth API chain', () => {
  test('onboard → session → me succeeds', async ({ request }) => {
    const unique = Date.now();
    const { token, email } = await obtainBearerToken(unique);

    const onboard = await request.post(`${apiUrl}/api/v1/auth/onboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'API E2E User',
        email,
        organizationName: `E2E Org ${unique}`,
      },
    });
    await expectApiStatus(onboard, 201, 'POST /api/v1/auth/onboard');

    const session = await request.get(`${apiUrl}/api/v1/auth/session`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await expectApiStatus(session, 200, 'GET /api/v1/auth/session');
    const sessionBody = (await session.json()) as { onboarded: boolean; user?: { email: string } };
    expect(sessionBody.onboarded).toBe(true);
    expect(sessionBody.user?.email).toBe(email);

    const me = await request.get(`${apiUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await expectApiStatus(me, 200, 'GET /api/v1/auth/me');
    const meBody = (await me.json()) as { user: { email: string }; organizations: unknown[] };
    expect(meBody.user.email).toBe(email);
    expect(meBody.organizations.length).toBeGreaterThan(0);

    if (isApiJwksMode()) {
      await signOutSupabase();
    }
  });

  test('session returns onboarded false without token', async ({ request }) => {
    const session = await request.get(`${apiUrl}/api/v1/auth/session`);
    await expectApiStatus(session, 200, 'GET /api/v1/auth/session (anonymous)');
    const body = (await session.json()) as { onboarded: boolean };
    expect(body.onboarded).toBe(false);
  });

  test('onboard rejects missing token', async ({ request }) => {
    const onboard = await request.post(`${apiUrl}/api/v1/auth/onboard`, {
      headers: { 'Content-Type': 'application/json' },
      data: { name: 'No Auth' },
    });
    await expectApiStatus(onboard, 401, 'POST /api/v1/auth/onboard (no token)');
  });
});
