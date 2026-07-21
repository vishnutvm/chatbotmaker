import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { readEnv } from './helpers/env';
import { createAdminUser, deleteAdminUser, hasServiceRoleForE2E } from './helpers/supabase-session';

const supabaseUrl = readEnv('E2E_SUPABASE_URL');
const supabaseAnonKey = readEnv('E2E_SUPABASE_ANON_KEY');
const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

async function readPageDiagnostics(page: import('@playwright/test').Page): Promise<string> {
  const errorText = await page.getByTestId('signup-error').textContent().catch(() => null)
    ?? await page.getByTestId('login-error').textContent().catch(() => null);
  return [
    `url=${page.url()}`,
    errorText ? `error="${errorText.trim()}"` : 'error=(none visible)',
  ].join('; ');
}

async function expectDashboardOrThrow(page: import('@playwright/test').Page, phase: string): Promise<void> {
  try {
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 45_000 });
  } catch {
    throw new Error(`[${phase}] did not reach /dashboard. ${await readPageDiagnostics(page)}`);
  }
}

test.describe('Auth UI full flow (Supabase)', () => {
  test.skip(!supabaseConfigured, 'Set E2E_SUPABASE_URL and E2E_SUPABASE_ANON_KEY');

  test(
    'email signup → onboard → dashboard → logout → login → dashboard',
    { timeout: 120_000 },
    async ({ page }) => {
      const unique = Date.now();
      const email = `e2e+${unique}@example.com`;
      const password = `E2eTest!${unique}`;
      const name = 'E2E User';
      let adminUserId: string | undefined;

      if (hasServiceRoleForE2E()) {
        // Fast path: admin-create a confirmed user, then sign in via the login UI.
        // This skips the UI signup form and email-confirmation race entirely.
        const { userId } = await createAdminUser(email, password, name);
        adminUserId = userId;

        await page.goto('/login');
        await page.getByTestId('login-email').fill(email);
        await page.getByTestId('login-password').fill(password);
        await page.getByTestId('login-submit').click();
        await expectDashboardOrThrow(page, 'Initial login after admin-create');
      } else {
        // Fallback path: UI signup (requires autoconfirm to be ON in Supabase Auth).
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
          if (/confirm|check your email/i.test(successText)) {
            throw new Error(
              `Signup requires email confirmation. Set E2E_SUPABASE_SERVICE_ROLE_KEY for CI ` +
                `or disable "Confirm email" in Supabase Auth. ${diag}`,
            );
          }
          throw new Error(`Signup flow failed. ${diag}`);
        }
      }

      await expect(page.getByTestId('dashboard-welcome')).toBeVisible({ timeout: 15_000 });

      await page.getByRole('link', { name: /Create assistant/i }).click();
      await expect(page.getByText('Create your AI assistant')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText('Customer Support')).toBeVisible();

      // Logout then verify protected route redirects.
      await page.getByTestId('user-menu-trigger').click();
      await page.getByTestId('logout-button').click();
      await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);

      // Login again.
      await page.getByTestId('login-email').fill(email);
      await page.getByTestId('login-password').fill(password);
      await page.getByTestId('login-submit').click();
      await expectDashboardOrThrow(page, 'Login');
      await expect(page.getByTestId('dashboard-welcome')).toBeVisible({ timeout: 15_000 });

      // Cleanup: delete admin-created user so CI doesn't accumulate stale accounts.
      if (adminUserId && hasServiceRoleForE2E()) {
        await deleteAdminUser(adminUserId).catch(() => undefined);
      }
    },
  );

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
