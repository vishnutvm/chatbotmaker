import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.E2E_SUPABASE_URL;
const supabaseAnonKey = process.env.E2E_SUPABASE_ANON_KEY;
const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

test.describe('Auth UI full flow (Supabase)', () => {
  test.skip(!supabaseConfigured, 'Set E2E_SUPABASE_URL and E2E_SUPABASE_ANON_KEY');

  test('email signup → onboard → dashboard → logout → login → dashboard', async ({ page }) => {
    const unique = Date.now();
    const email = `e2e+${unique}@example.com`;
    const password = `E2eTest!${unique}`;
    const name = 'E2E User';
    const company = `E2E Company ${unique}`;

    await page.goto('/signup');
    await page.getByTestId('signup-name').fill(name);
    await page.getByTestId('signup-email').fill(email);
    await page.getByTestId('signup-password').fill(password);
    await page.getByTestId('signup-org').fill(company);
    await page.getByTestId('signup-submit').click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 45_000 });
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

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 45_000 });
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
