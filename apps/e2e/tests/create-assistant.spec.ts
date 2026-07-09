import { test, expect } from '@playwright/test';

test.describe('Create Assistant wizard', () => {
  test('first-time dashboard shows onboarding CTA', async ({ page }) => {
    await page.goto('/');
    // If not authenticated, will redirect to login — skip in CI without auth
    if (page.url().includes('/login')) {
      test.skip();
      return;
    }
    const cta = page.getByRole('link', { name: /Create Your First Assistant/i });
    const dashboard = page.getByTestId('dashboard-welcome');
    await expect(cta.or(dashboard)).toBeVisible();
  });

  test('wizard create step renders purpose cards', async ({ page }) => {
    await page.goto('/assistants/new/create');
    if (page.url().includes('/login')) {
      test.skip();
      return;
    }
    await expect(page.getByText('Create your AI assistant')).toBeVisible();
    await expect(page.getByText('Customer Support')).toBeVisible();
    await expect(page.getByPlaceholder('e.g. Support Assistant')).toBeVisible();
  });
});
