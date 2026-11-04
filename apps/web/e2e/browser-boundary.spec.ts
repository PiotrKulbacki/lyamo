import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { prisma } from '@lyamo/database';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';

// The S00 runner provisions this database and refuses inherited service credentials.
if (
  process.env.LYAMO_TEST_ENV !== '1' ||
  new URL(process.env.DATABASE_URL!).hostname !== '127.0.0.1' ||
  new URL(process.env.DATABASE_URL!).pathname !== '/lyamo_security_test'
)
  throw new Error('Use isolated E2E runner');
test.setTimeout(90_000);
test.use({ actionTimeout: 30_000 });
const password = 'Synthetic-test-password-123!';
let id: string;
let email: string;
test.beforeAll(async () => {
  id = randomUUID();
  email = `s01-${id}@example.invalid`;
  await prisma.user.create({
    data: { id, email, passwordHash: await bcrypt.hash(password, 4), emailVerifiedAt: new Date() },
  });
});
test.afterAll(async () => {
  await prisma.user.delete({ where: { id } });
  await prisma.$disconnect();
});

for (const redirect of [
  '/history',
  'javascript:window.__s01xss=1',
  '//evil.example',
  '/%252f%252fevil.example',
  '/\\evil.example',
]) {
  test(`login redirect ${redirect}`, async ({ page, baseURL }) => {
    await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`);
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.locator('button[type=submit]').click();
    await expect(page).toHaveURL(
      `${baseURL}${redirect === '/history' ? '/history' : '/dashboard'}`,
      { timeout: 30_000 }
    );
    expect(await page.evaluate(() => '__s01xss' in window)).toBe(false);
  });
}

for (const state of ['unknown', 'expired', 'deleted']) {
  test(`stale ${state} session permits recovery and clears on protected navigation`, async ({
    page,
    context,
    baseURL,
  }) => {
    const token = randomUUID();
    const hash = createHash('sha256').update(token).digest('hex');
    if (state !== 'unknown') {
      const session = await prisma.session.create({
        data: {
          userId: id,
          token: hash,
          expiresAt: new Date(state === 'expired' ? 0 : Date.now() + 60000),
        },
      });
      if (state === 'deleted') await prisma.session.delete({ where: { id: session.id } });
    }
    await context.addCookies([
      { name: 'sec_session', value: token, url: baseURL!, httpOnly: true, sameSite: 'Lax' },
    ]);
    for (const path of ['/login', '/forgot-password', '/reset-password']) {
      await page.goto(path);
      expect(new URL(page.url()).pathname).toBe(path);
    }
    await page.goto('/dashboard');
    await expect(page).toHaveURL(`${baseURL}/login`);
    expect((await context.cookies()).some((c) => c.name === 'sec_session')).toBe(false);
  });
}

test('browser login and cookie mutations reject foreign origin; same-origin login/logout works', async ({
  page,
  request,
  baseURL,
}) => {
  const login = await request.post('/api/auth/login', {
    headers: { origin: baseURL! },
    data: { email, password },
  });
  expect(login.status()).toBe(200);
  expect(login.headers()['set-cookie']).toContain('HttpOnly');
  const headers = {
    origin: 'https://evil.example',
    authorization: 'Bearer invalid',
    'x-client-platform': 'mobile',
  };
  expect((await request.post('/api/auth/logout', { headers })).status()).toBe(403);
  expect(
    (await request.patch('/api/auth/me', { headers, data: { name: 'forged' } })).status()
  ).toBe(403);
  expect(
    (await request.post('/api/auth/login', { headers, data: { email, password } })).status()
  ).toBe(403);
  await page.goto('/login');
  expect(
    await page.evaluate(async () => (await fetch('/api/auth/logout', { method: 'POST' })).status)
  ).toBe(200);
  // This cleanup GET cannot log out a live session.
  expect((await request.get('/api/auth/session/clear', { maxRedirects: 0 })).status()).toBe(307);
  expect((await request.get('/api/auth/me')).status()).toBe(200);
});

test('native login, bearer mutation and refresh remain cookie-free', async ({ request }) => {
  const login = await request.post('/api/auth/login', {
    headers: { 'x-client-platform': 'mobile' },
    data: { email, password },
  });
  expect(login.status()).toBe(200);
  expect(login.headers()['set-cookie']).toBeUndefined();
  const tokens = await login.json();
  expect(
    (
      await request.patch('/api/auth/me', {
        headers: { origin: 'capacitor://localhost', authorization: `Bearer ${tokens.accessToken}` },
        data: { name: 'Native fixture' },
      })
    ).status()
  ).toBe(200);
  expect(
    (
      await request.post('/api/auth/refresh', { data: { refreshToken: tokens.refreshToken } })
    ).status()
  ).toBe(200);
});

test('OAuth callback uses state and webhook still uses Stripe signature', async ({ request }) => {
  const callback = await request.get('/api/auth/google/callback?code=invalid&state=invalid', {
    maxRedirects: 0,
  });
  expect(callback.status()).toBe(307);
  expect(callback.headers().location).toContain('/login?error=');
  const hook = await request.post('/api/webhooks/stripe', {
    headers: { origin: 'https://stripe.example', 'content-type': 'text/plain' },
    data: '{}',
  });
  expect([400, 503]).toContain(hook.status());
});

test('bodyless API clients reach authentication on every supported route', async ({
  request,
  baseURL,
}) => {
  for (const [method, path] of [
    ['POST', '/api/billing/portal'],
    ['DELETE', '/api/auth/me'],
    ['DELETE', '/api/categories/synthetic-absent'],
    ['DELETE', '/api/recurring-expenses/synthetic-absent'],
    ['DELETE', '/api/transactions/synthetic-absent'],
    ['DELETE', '/api/transactions/group/synthetic-absent'],
  ]) {
    expect((await request.fetch(path!, { method, headers: { origin: baseURL! } })).status()).toBe(
      401
    );
  }
});
