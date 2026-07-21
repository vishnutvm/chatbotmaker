import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { readEnv } from './helpers/env';
import { confirmUserEmailById, hasServiceRoleForE2E } from './helpers/supabase-session';

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

/**
 * Complete signup when Supabase requires email confirmation:
 * intercept signup response → admin-confirm → login via UI → dashboard.
 */
async function finishSignupWithAdminConfirm(
  page: import('@playwright/test').Page,
  email: string,
  password: string,
  userId: string,
): Promise<void> {
  if (!hasServiceRoleForE2E()) {
    throw new Error(
      `Signup created user ${userId} without a session (Confirm email is enabled) and ` +
        `E2E_SUPABASE_SERVICE_ROLE_KEY is not set. Disable Confirm email in Supabase Auth, ` +
        `or add the service-role secret for CI. ${await readSignupDiagnostics(page)}`,
    );
  }

  await confirmUserEmailById(userId);
  await page.goto('/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
  await expectDashboardOrThrow(page, 'Post-confirm login');
}

test.describe('Auth UI full flow (Supabase)', () => {
  test.skip(!supabaseConfigured, 'Set E2E_SUPABASE_URL and E2E_SUPABASE_ANON_KEY');

  test('email signup → onboard → dashboard → logout → login → dashboard', async ({ page }) => {
    const unique = Date.now();
    let email = `e2e+${unique}@example.com`;
    const password = `E2eTest!${unique}`;
    const name = 'E2E User';

    await page.goto('/signup');
    await page.getByTestId('signup-name').fill(name);
    await page.getByTestId('signup-email').fill(email);
    await page.getByTestId('signup-password').fill(password);
    await expect(page.getByTestId('signup-org')).toHaveCount(0);

    let signupAttempt = 0;
    const maxSignupAttempts = 3;
    let reachedDashboard = false;

    while (signupAttempt < maxSignupAttempts) {
      signupAttempt += 1;
      const attemptEmail = signupAttempt === 1 ? email : `e2e+${unique}-r${signupAttempt}@example.com`;
      if (signupAttempt > 1) {
        await page.getByTestId('signup-email').fill(attemptEmail);
      }

      const signupResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/auth/v1/signup') &&
          (response.status() === 200 || response.status() >= 400),
        { timeout: 30_000 },
      );

      await page.getByTestId('signup-submit').click();

      const signupResponse = await signupResponsePromise.catch(() => null);
      let signupUserId: string | undefined;
      let signupHasSession = false;
      let signupStatus = 0;
      let signupBodyText = '';

      if (signupResponse) {
        signupStatus = signupResponse.status();
        signupBodyText = await signupResponse.text().catch(() => '');
        try {
          const body = JSON.parse(signupBodyText) as {
            access_token?: string;
            user?: { id?: string };
            id?: string;
          };
          signupUserId = body.user?.id ?? body.id;
          signupHasSession = Boolean(body.access_token);
        } catch {
          // non-JSON body
        }
      }

      // Confirm-email path: no session — admin-confirm immediately (skip 45s dashboard wait).
      if (signupUserId && !signupHasSession && signupStatus < 400) {
        await finishSignupWithAdminConfirm(page, attemptEmail, password, signupUserId);
        // Keep credentials used for the rest of the test (logout → login).
        email = attemptEmail;
        reachedDashboard = true;
        break;
      }

      reachedDashboard = await page
        .waitForURL(/\/dashboard/, { timeout: 45_000 })
        .then(() => true)
        .catch(() => false);

      if (reachedDashboard) {
        email = attemptEmail;
        break;
      }

      const diagnostics = await readSignupDiagnostics(page);
      const isRateLimited =
        signupStatus === 429 ||
        /rate limit|too many requests|over_email_send_rate_limit/i.test(
          `${diagnostics} ${signupBodyText}`,
        );

      if (isRateLimited && signupAttempt < maxSignupAttempts) {
        await page.waitForTimeout(2_000 * signupAttempt);
        continue;
      }

      throw new Error(`Signup flow failed. status=${signupStatus}; ${diagnostics}`);
    }

    expect(reachedDashboard).toBe(true);
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
