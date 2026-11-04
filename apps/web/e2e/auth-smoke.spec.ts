import { expect, test } from '@playwright/test';

test('renders login and rejects an unauthenticated browser API request', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  const status = await page.evaluate(async () => (await fetch('/api/auth/me')).status);
  expect(status).toBe(401);
});
