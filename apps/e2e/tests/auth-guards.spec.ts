import { test, expect } from '@playwright/test';

const protectedRoutes = [
  '/dashboard',
  '/dashboard/assistants',
  '/dashboard/settings',
  '/dashboard/analytics',
];

test.describe('Auth route guards', () => {
  for (const route of protectedRoutes) {
    test(`unauthenticated ${route} redirects to login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test('onboard page redirects to login without Supabase session', async ({ page }) => {
    await page.goto('/signup?onboard=1');
    await expect(page).toHaveURL(/\/login/);
  });

  test('marketing home stays public', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
