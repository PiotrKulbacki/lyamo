import { afterEach, expect, test, vi } from 'vitest';
import { authFetch, retryAfterSeconds } from './client-request';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
test('parses seconds, HTTP date and invalid cooldown headers', () => {
  expect(retryAfterSeconds('30')).toBe(30);
  expect(
    retryAfterSeconds('Thu, 05 Nov 2026 12:01:00 GMT', Date.parse('2026-11-05T12:00:00Z'))
  ).toBe(60);
  expect(retryAfterSeconds('invalid')).toBe(60);
  expect(retryAfterSeconds('-1')).toBe(1);
});
test.each([429, 503])(
  'honors %s cooldown, leaves other operations usable, never retries automatically',
  async (status) => {
    vi.useFakeTimers();
    const fetcher = vi.fn(
      async () => new Response('{}', { status, headers: { 'Retry-After': '30' } })
    );
    vi.stubGlobal('fetch', fetcher);
    const url = `/api/auth/test-${status}`;
    await authFetch(url);
    expect((await authFetch(url)).status).toBe(status);
    expect(fetcher).toHaveBeenCalledTimes(1);
    await authFetch(`${url}-other`);
    expect(fetcher).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(31000);
    await authFetch(url);
    expect(fetcher).toHaveBeenCalledTimes(3);
  }
);
