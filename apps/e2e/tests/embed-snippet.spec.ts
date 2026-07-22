import { test, expect } from '@playwright/test';
import { expectApiStatus } from './helpers/api-response';
import { signTestJwt } from './helpers/test-jwt';

const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:4000';

test.describe('Embed snippet — route guards', () => {
  test('unauthenticated assistant deploy redirects to login', async ({ page }) => {
    await page.goto('/dashboard/assistants/00000000-0000-0000-0000-000000000001/deploy');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Publishable keys API (embed auth)', () => {
  test.skip(
    process.env.E2E_WEB_ONLY === 'true',
    'Requires full-stack API server (full-stack Playwright project)',
  );

  test('create → list publishable keys for org owner', async ({ request }) => {
    const unique = Date.now();
    const { token, email } = signTestJwt({ email: `pk-e2e-${unique}@example.com` });

    const onboard = await request.post(`${apiUrl}/api/v1/auth/onboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'PK E2E User',
        email,
        organizationName: `PK Org ${unique}`,
      },
    });
    await expectApiStatus(onboard, 201, 'POST /api/v1/auth/onboard');

    const me = await request.get(`${apiUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await expectApiStatus(me, 200, 'GET /api/v1/auth/me');
    const meBody = (await me.json()) as {
      organizations: Array<{ id: string; role: string }>;
    };
    const orgId = meBody.organizations[0]?.id;
    expect(orgId).toBeTruthy();

    const create = await request.post(
      `${apiUrl}/api/v1/organizations/${orgId}/public-keys`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: { name: 'E2E embed' },
      },
    );
    await expectApiStatus(create, 201, 'POST public-keys');
    const created = (await create.json()) as { key: string; keyPrefix: string };
    expect(created.key).toMatch(/^pk_live_/);
    expect(created.keyPrefix.startsWith('pk_live_')).toBe(true);

    const list = await request.get(
      `${apiUrl}/api/v1/organizations/${orgId}/public-keys`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    await expectApiStatus(list, 200, 'GET public-keys');
    const listBody = (await list.json()) as { keys: Array<{ keyPrefix: string }> };
    expect(listBody.keys.length).toBeGreaterThan(0);
    expect(listBody.keys.some((k) => k.keyPrefix === created.keyPrefix)).toBe(true);
  });
});
