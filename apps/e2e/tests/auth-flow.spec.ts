import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { readEnv } from './helpers/env';

const supabaseUrl = readEnv('E2E_SUPABASE_URL');
const supabaseAnonKey = readEnv('E2E_SUPABASE_ANON_KEY');
const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

async function readSignupDiagnostics(page: import('@playwright/test').Page): Promise<string> {
  const errorText = await page.getByTestId('signup-error').textContent().catch(() => null);
  const successText = await page.getByTestId('signup-success').textContent().catch(() => null);
  const loading = await page.getByTestId('signup-submit').textContent().catch(() => null);
  return [
    `url=${page.url()}`,
    errorText ? `error="${errorText.trim()}"` : 'error=(none visible)',
    successText ? `success="${successText.trim()}"` : 'success=(none visible)',
    loading ? `submit="${loading.trim()}"` : '',
  ]
    .filter(Boolean)
    .join('; ');
}

async function expectDashboardOrThrow(page: import('@playwright/test').Page, phase: string): Promise<void> {
  try {
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 45_000 });
  } catch {
    throw new Error(`${phase} did not reach /dashboard. ${await readSignupDiagnostics(page)}`);
  }
}

test.describe('Auth UI full flow (Supabase)', () => {
  test.skip(!supabaseConfigured, 'Set E2E_SUPABASE_URL and E2E_SUPABASE_ANON_KEY');

  test('email signup → onboard → dashboard → logout → login → dashboard', async ({ page }) => {
    const unique = Date.now();
    const email = `e2e+${unique}@example.com`;
    const password = `E2eTest!${unique}`;
    const name = 'E2E User';

    await page.goto('/signup');
    await page.getByTestId('signup-name').fill(name);
    await page.getByTestId('signup-email').fill(email);
    await page.getByTestId('signup-password').fill(password);
    await expect(page.getByTestId('signup-org')).toHaveCount(0);

    let signupAttempt = 0;
    const maxSignupAttempts = 3;
    while (signupAttempt < maxSignupAttempts) {
      signupAttempt += 1;
      await page.getByTestId('signup-submit').click();

      const reachedDashboard = await page
        .waitForURL(/\/dashboard/, { timeout: 45_000 })
        .then(() => true)
        .catch(() => false);

      if (reachedDashboard) {
        break;
      }

      const diagnostics = await readSignupDiagnostics(page);
      const isRateLimited = /rate limit|too many requests/i.test(diagnostics);

      if (isRateLimited && signupAttempt < maxSignupAttempts) {
        await page.waitForTimeout(2_000 * signupAttempt);
        continue;
      }

      throw new Error(`Signup flow failed. ${diagnostics}`);
    }

    await expect(page.getByTestId('dashboard-welcome')).toBeVisible({ timeout: 15_000 });

    await page.getByRole('link', { name: /Create assistant/i }).click();
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
  });

  test('login page links to signup', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test.afterEach(async ({}, testInfo) => {
    if (!supabaseConfigured || testInfo.status !== 'passed') return;
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    await supabase.auth.signOut();
  });
});
