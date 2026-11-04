import { beforeEach, expect, test, vi } from 'vitest';
const { bearer } = vi.hoisted(() => ({ bearer: vi.fn() }));
vi.mock('@web/env', () => ({ env: { NEXT_PUBLIC_APP_URL: 'https://lyamo.example' } }));
vi.mock('@web/features/auth/services/auth.service', () => ({ getUserFromBearerToken: bearer }));
import { protectMutation } from './mutation-protection';

beforeEach(() => {
  bearer.mockReset();
  bearer.mockResolvedValue(null);
});
const request = (headers: Record<string, string>, body: string | null = '{}') =>
  new Request('https://untrusted-host.example/api/auth/login', { method: 'POST', headers, body });

test('accepts same configured origin JSON and bodyless mutations', async () => {
  expect(
    await protectMutation(
      request({ origin: 'https://lyamo.example', 'content-type': 'application/json' })
    )
  ).toBeNull();
  expect(await protectMutation(request({ origin: 'https://lyamo.example' }, null))).toBeNull();
});

test.each([
  'https://evil.example',
  'https://lyamo.example.evil',
  'null',
  'https://untrusted-host.example',
])('rejects origin %s including login CSRF without cookies', async (origin) => {
  expect(
    (await protectMutation(request({ origin, 'content-type': 'application/json' })))?.status
  ).toBe(403);
});

test('rejects missing origin with cookies, fake mobile and invalid Bearer', async () => {
  expect(
    (
      await protectMutation(
        request({
          cookie: 'sec_session=valid',
          authorization: 'Bearer bogus',
          'x-client-platform': 'mobile',
          'content-type': 'application/json',
        }),
        { bearer: true }
      )
    )?.status
  ).toBe(403);
});

test('accepts cookie-free native JSON and verified Bearer with foreign origin', async () => {
  expect(
    await protectMutation(
      request({ 'content-type': 'application/json', 'x-client-platform': 'mobile' })
    )
  ).toBeNull();
  bearer.mockResolvedValue({ id: 'native' });
  expect(
    await protectMutation(
      request({
        origin: 'capacitor://localhost',
        authorization: 'Bearer valid',
        'content-type': 'application/json',
      }),
      { bearer: true }
    )
  ).toBeNull();
});

test('does not grant bearer exemption to login or requests carrying cookies', async () => {
  bearer.mockResolvedValue({ id: 'native' });
  const headers = {
    origin: 'https://evil.example',
    authorization: 'Bearer valid',
    'content-type': 'application/json',
  };
  expect((await protectMutation(request(headers)))?.status).toBe(403);
  expect(
    (await protectMutation(request({ ...headers, cookie: 'sec_session=valid' }), { bearer: true }))
      ?.status
  ).toBe(403);
});

test('rejects simple form types and browser metadata without Origin', async () => {
  for (const type of ['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data']) {
    expect(
      (await protectMutation(request({ origin: 'https://lyamo.example', 'content-type': type })))
        ?.status
    ).toBe(415);
  }
  expect(
    (
      await protectMutation(
        request({ 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' })
      )
    )?.status
  ).toBe(403);
});

test('allows receipt multipart only with same origin or verified bearer', async () => {
  const headers = { 'content-type': 'multipart/form-data; boundary=test' };
  expect(
    await protectMutation(request({ ...headers, origin: 'https://lyamo.example' }), {
      multipart: true,
    })
  ).toBeNull();
  expect((await protectMutation(request(headers), { multipart: true }))?.status).toBe(403);
  bearer.mockResolvedValue({ id: 'native' });
  expect(
    await protectMutation(request({ ...headers, authorization: 'Bearer valid' }), {
      multipart: true,
      bearer: true,
    })
  ).toBeNull();
});

test('supports Vercel empty request streams only for explicitly bodyless handlers', async () => {
  const empty = (headers: Record<string, string>) =>
    new Request('https://lyamo.example/api/auth/logout', {
      method: 'POST',
      headers,
      body: new Uint8Array(0),
    });
  expect((await protectMutation(empty({ origin: 'https://lyamo.example' })))?.status).toBe(415);
  expect(
    await protectMutation(empty({ origin: 'https://lyamo.example' }), { bodyless: true })
  ).toBeNull();
  expect(
    (await protectMutation(empty({ origin: 'https://evil.example' }), { bodyless: true }))?.status
  ).toBe(403);
  expect(
    (
      await protectMutation(
        empty({ cookie: 'sec_session=valid', authorization: 'Bearer invalid' }),
        { bodyless: true, bearer: true }
      )
    )?.status
  ).toBe(403);
  expect(
    (
      await protectMutation(
        empty({
          origin: 'https://lyamo.example',
          'content-type': 'application/x-www-form-urlencoded',
        }),
        { bodyless: true }
      )
    )?.status
  ).toBe(415);
});
