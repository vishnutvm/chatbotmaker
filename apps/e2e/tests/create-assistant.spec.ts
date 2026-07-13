import { test, expect } from '@playwright/test';

test.describe('Create Assistant wizard (unauthenticated)', () => {
  test('wizard URL redirects to login without session', async ({ page }) => {
    await page.goto('/dashboard/assistants/new/create');
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });
});
