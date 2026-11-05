import { beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  redisLimit: vi.fn(),
  fallback: vi.fn(),
  capture: vi.fn(),
  env: {
    AUTH_SECRET: 'test-only-secret-at-least-32-characters',
    UPSTASH_REDIS_REST_URL: 'https://redis.invalid' as string | undefined,
    UPSTASH_REDIS_REST_TOKEN: 'synthetic',
  },
}));
vi.mock('@web/env', () => ({ env: mocks.env }));
vi.mock('@sentry/nextjs', () => ({ captureMessage: mocks.capture }));
vi.mock('@web/features/auth/services/auth-throttle.service', () => ({
  claimAuthBudget: mocks.fallback,
}));
vi.mock('@upstash/redis', () => ({ Redis: class {} }));
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static slidingWindow = vi.fn();
    limit = mocks.redisLimit;
  },
}));
import { checkAuthRateLimit, authRateLimitResponse, getClientIp } from './rate-limit';
const req = (ip = '192.0.2.1', extra = {}) =>
  new Request('https://local.invalid', {
    headers: { 'x-vercel-forwarded-for': ip, ...extra },
  });
beforeEach(() => {
  vi.stubEnv('VERCEL', '1');
  mocks.redisLimit
    .mockReset()
    .mockResolvedValue({ success: true, remaining: 4, reset: Date.now() + 60000 });
  mocks.fallback.mockReset().mockResolvedValue({
    allowed: true,
    remaining: 4,
    reset: Date.now() + 60000,
    limit: 5,
    key: 'db',
  });
});
test('uses only Vercel ingress IP and canonicalizes IPv6; rejects forged chains/other hosts', () => {
  expect(getClientIp(req('192.0.2.1', { 'x-forwarded-for': '198.51.100.7' }))).toBe('192.0.2.1');
  expect(getClientIp(req('::1'))).toBe(getClientIp(req('0:0:0:0:0:0:0:1')));
  expect(getClientIp(req('1.2.3.4, 5.6.7.8'))).toBe('unknown');
  vi.stubEnv('VERCEL', '');
  expect(getClientIp(req())).toBe('unknown');
});
test('rotating IP and email case cannot bypass account limits; keys contain no address', async () => {
  await checkAuthRateLimit(req(), 'login', 'Owner@Example.invalid');
  const key = mocks.redisLimit.mock.calls[0][0];
  await checkAuthRateLimit(req('192.0.2.2'), 'login', ' owner@example.invalid ');
  expect(mocks.redisLimit.mock.calls[2][0]).toBe(key);
  expect(key).toMatch(/^[a-f0-9]{64}$/);
});
test.each(['timeout', 'exception'])(
  'Redis %s falls back to a distributed budget',
  async (reason) => {
    if (reason === 'timeout')
      mocks.redisLimit.mockResolvedValue({ success: true, reason: 'timeout' });
    else mocks.redisLimit.mockRejectedValue(new Error('synthetic'));
    expect((await checkAuthRateLimit(req(), 'login')).allowed).toBe(true);
    expect(mocks.fallback).toHaveBeenCalled();
    mocks.fallback.mockRejectedValue(new Error('db unavailable'));
    const response = authRateLimitResponse(await checkAuthRateLimit(req(), 'login'));
    expect(response.status).toBe(503);
    expect(response.headers.get('Retry-After')).toBe('60');
  }
);
test('denied limits return 429 and Retry-After without invoking fallback', async () => {
  mocks.redisLimit.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() + 30000 });
  const response = authRateLimitResponse(await checkAuthRateLimit(req(), 'register'));
  expect(response.status).toBe(429);
  expect(Number(response.headers.get('Retry-After'))).toBeGreaterThan(0);
  expect(mocks.fallback).not.toHaveBeenCalled();
});
test('mail operations share a mailbox digest, other accounts have independent budgets', async () => {
  await checkAuthRateLimit(req(), 'register', 'one@example.invalid');
  const sharedKey = mocks.redisLimit.mock.calls[1][0];
  await checkAuthRateLimit(req(), 'forgot-password', 'one@example.invalid');
  expect(mocks.redisLimit.mock.calls[3][0]).toBe(sharedKey);
  await checkAuthRateLimit(req(), 'resend-verification', 'two@example.invalid');
  expect(mocks.redisLimit.mock.calls[5][0]).not.toBe(sharedKey);
});

test('missing Redis configuration still enforces database budgets', async () => {
  vi.resetModules();
  mocks.env.UPSTASH_REDIS_REST_URL = undefined;
  const fresh = await import('./rate-limit');
  const result = await fresh.checkAuthRateLimit(req(), 'login');
  expect(result.allowed).toBe(true);
  expect(mocks.fallback).toHaveBeenCalled();
  expect(mocks.capture).toHaveBeenCalled();
  mocks.env.UPSTASH_REDIS_REST_URL = 'https://redis.invalid';
});
