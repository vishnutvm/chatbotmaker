import { test, expect } from '@playwright/test';

test.describe('Dashboard UI smoke', () => {
  test('login page renders form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();
  });

  test('signup page renders form', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByTestId('signup-form')).toBeVisible();
    await expect(page.getByTestId('signup-name')).toBeVisible();
    await expect(page.getByTestId('signup-email')).toBeVisible();
    await expect(page.getByTestId('signup-password')).toBeVisible();
    await expect(page.getByTestId('signup-submit')).toBeVisible();
  });

  test('unauthenticated user is redirected from home to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });
});
