import { expect, test } from '@playwright/test';

test('opening verification link does not consume it and removes the fragment', async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([
    {
      name: 'sec_cookie_consent',
      value: encodeURIComponent(
        JSON.stringify({
          necessary: true,
          analytics: true,
          marketing: true,
          decidedAt: new Date().toISOString(),
          version: 1,
        })
      ),
      url: baseURL!,
    },
  ]);
  const leakingRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('synthetic-secret')) leakingRequests.push(request.url());
  });
  let attempts = 0;
  await page.route('**/api/auth/verify-email', async (route) => {
    attempts++;
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'auth.errors.invalidVerificationToken' }),
    });
  });
  await page.goto('/verify-email#token=synthetic-secret');
  await expect(page).toHaveURL(/\/verify-email$/);
  expect(attempts).toBe(0);
  expect(leakingRequests).toEqual([]);
  await page
    .locator('button')
    .filter({ hasText: /verify|zweryfikuj|bestätigen|verificar/i })
    .first()
    .click();
  await expect.poll(() => attempts).toBe(1);
});

test('reset link leaves no token in browser URL', async ({ page }) => {
  await page.goto('/reset-password#token=synthetic-secret');
  await expect(page).toHaveURL(/\/reset-password$/);
  await expect(page.locator('button[type=submit]')).toBeEnabled();
});
