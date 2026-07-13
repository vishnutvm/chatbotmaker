import { test, expect } from '@playwright/test';

test.describe('Web app smoke', () => {
  test('marketing home renders', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('login page renders form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();
    await expect(page.getByTestId('google-sign-in')).toBeVisible();
  });

  test('signup page renders form', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByTestId('signup-form')).toBeVisible();
    await expect(page.getByTestId('signup-name')).toBeVisible();
    await expect(page.getByTestId('signup-email')).toBeVisible();
    await expect(page.getByTestId('signup-password')).toBeVisible();
    await expect(page.getByTestId('signup-submit')).toBeVisible();
    await expect(page.getByTestId('google-sign-up')).toBeVisible();
  });

  test('marketing header get started links to signup', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('banner').getByRole('link', { name: 'Get Started' })).toHaveAttribute(
      'href',
      '/signup',
    );
  });
});
