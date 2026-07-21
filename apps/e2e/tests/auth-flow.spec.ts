import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { expectApiStatus } from './helpers/api-response';
import { readEnv } from './helpers/env';
import {
  createSupabaseAccessToken,
  deleteAdminUser,
  hasServiceRoleForE2E,
} from './helpers/supabase-session';

const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:4000';
const supabaseUrl = readEnv('E2E_SUPABASE_URL');
const supabaseAnonKey = readEnv('E2E_SUPABASE_ANON_KEY');
const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

async function readPageDiagnostics(page: import('@playwright/test').Page): Promise<string> {
  const errorText =
    (await page.getByTestId('login-error').textContent().catch(() => null)) ??
    (await page.getByTestId('signup-error').textContent().catch(() => null)) ??
    (await page.locator('.text-destructive').first().textContent().catch(() => null));
  const submitText = await page.getByTestId('login-submit').textContent().catch(() => null);
  return [
    `url=${page.url()}`,
    errorText ? `error="${errorText.trim()}"` : 'error=(none visible)',
    submitText ? `submit="${submitText.trim()}"` : '',
  ]
    .filter(Boolean)
    .join('; ');
}

async function expectDashboardOrThrow(
  page: import('@playwright/test').Page,
  phase: string,
): Promise<void> {
  try {
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 45_000 });
  } catch {
    throw new Error(`[${phase}] did not reach /dashboard. ${await readPageDiagnostics(page)}`);
  }
}

test.describe('Auth UI full flow (Supabase)', () => {
  test.describe.configure({ timeout: 120_000 });
  test.skip(!supabaseConfigured, 'Set E2E_SUPABASE_URL and E2E_SUPABASE_ANON_KEY');

  test('email signup → onboard → dashboard → logout → login → dashboard', async ({
    page,
    request,
  }) => {
    const unique = Date.now();
    const email = `e2e+${unique}@example.com`;
    const password = `E2eTest!${unique}`;
    const name = 'E2E User';
    let adminUserId: string | undefined;

    if (hasServiceRoleForE2E()) {
      // Deterministic CI path:
      // 1) admin-create + sign-in (real ES256 JWT)
      // 2) onboard via API (fails loudly if JWKS broken)
      // 3) UI login → ensureOnboarded sees already onboarded → /dashboard
      const { token, supabaseUserId } = await createSupabaseAccessToken(email, password);
      adminUserId = supabaseUserId;

      const onboard = await request.post(`${apiUrl}/api/v1/auth/onboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: { name, email },
      });
      await expectApiStatus(onboard, 201, 'POST /api/v1/auth/onboard (pre-login)');

      await page.goto('/login');
      await page.getByTestId('login-email').fill(email);
      await page.getByTestId('login-password').fill(password);

      const sessionOrOnboard = page.waitForResponse(
        (res) =>
          res.url().includes('/api/v1/auth/session') ||
          res.url().includes('/api/v1/auth/onboard') ||
          res.url().includes('/auth/v1/token'),
        { timeout: 30_000 },
      );

      await page.getByTestId('login-submit').click();
      const authRes = await sessionOrOnboard.catch(() => null);
      if (authRes && authRes.status() >= 400) {
        const body = await authRes.text().catch(() => '');
        throw new Error(
          `Auth API call failed during login: ${authRes.status()} ${authRes.url()} body=${body.slice(0, 500)}. ` +
            (await readPageDiagnostics(page)),
        );
      }

      await expectDashboardOrThrow(page, 'Initial login after admin-create + API onboard');
    } else {
      // Fallback: UI signup (requires Confirm email OFF / autoconfirm ON).
      await page.goto('/signup');
      await page.getByTestId('signup-name').fill(name);
      await page.getByTestId('signup-email').fill(email);
      await page.getByTestId('signup-password').fill(password);
      await expect(page.getByTestId('signup-org')).toHaveCount(0);
      await page.getByTestId('signup-submit').click();

      const reached = await page
        .waitForURL(/\/dashboard/, { timeout: 45_000 })
        .then(() => true)
        .catch(() => false);

      if (!reached) {
        const diag = await readPageDiagnostics(page);
        const successText = await page.getByTestId('signup-success').textContent().catch(() => '');
        if (/confirm|check your email/i.test(successText ?? '')) {
          throw new Error(
            `Signup requires email confirmation. Set E2E_SUPABASE_SERVICE_ROLE_KEY or disable Confirm email. ${diag}`,
          );
        }
        throw new Error(`Signup flow failed. ${diag}`);
      }
    }

    await expect(page.getByTestId('dashboard-welcome')).toBeVisible({ timeout: 15_000 });

    await page.getByRole('link', { name: 'Create assistant', exact: true }).click();
    await expect(page.getByText('Create your AI assistant')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Customer Support')).toBeVisible();

    await page.getByTestId('user-menu-trigger').click();
    await page.getByTestId('logout-button').click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);

    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(password);
    await page.getByTestId('login-submit').click();
    await expectDashboardOrThrow(page, 'Login');
    await expect(page.getByTestId('dashboard-welcome')).toBeVisible({ timeout: 15_000 });

    if (adminUserId && hasServiceRoleForE2E()) {
      await deleteAdminUser(adminUserId).catch(() => undefined);
    }
  });

  test('login page links to signup', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test.afterEach(async ({}, testInfo) => {
    if (!supabaseConfigured || testInfo.status !== 'passed') return;
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    await supabase.auth.signOut().catch(() => undefined);
  });
});
