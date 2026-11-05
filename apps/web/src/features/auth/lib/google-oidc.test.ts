import { beforeAll, expect, test, vi } from 'vitest';
import * as oidc from 'openid-client';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { exchangeGoogleCode, getGoogleOAuthUrl, GOOGLE_ISSUER } from './google-oidc';

vi.mock('@web/env', () => ({
  env: {
    GOOGLE_CLIENT_ID: 'test-client',
    GOOGLE_CLIENT_SECRET: 'test-secret',
    NEXT_PUBLIC_APP_URL: 'https://app.example',
  },
}));
let keys: Awaited<ReturnType<typeof generateKeyPair>>;
beforeAll(async () => {
  keys = await generateKeyPair('RS256');
});
const checks = { state: 'test-state', nonce: 'test-nonce', codeVerifier: 'test-verifier' };

async function run(
  overrides: Record<string, unknown> = {},
  options: {
    badSignature?: boolean;
    pkce?: boolean;
    state?: string;
    malformed?: boolean;
  } = {}
) {
  const config = new oidc.Configuration(
    {
      issuer: GOOGLE_ISSUER,
      token_endpoint: 'https://oauth2.googleapis.com/token',
      jwks_uri: 'https://www.googleapis.com/oauth2/v3/certs',
    },
    'test-client',
    { client_secret: 'test-secret', id_token_signed_response_alg: 'RS256' }
  );
  oidc.enableNonRepudiationChecks(config);
  config[oidc.customFetch] = async (input, init) => {
    if (String(input).includes('/certs')) {
      const jwk = await exportJWK(keys.publicKey);
      return Response.json({ keys: [{ ...jwk, kid: 'test', alg: 'RS256', use: 'sig' }] });
    }
    const body = new URLSearchParams(String(init?.body));
    if (options.pkce || body.get('code_verifier') !== checks.codeVerifier) {
      return Response.json({ error: 'invalid_grant' }, { status: 400 });
    }
    if (options.malformed) return Response.json({ access_token: 123 });
    const now = Math.floor(Date.now() / 1000);
    const signingKey = options.badSignature
      ? (await generateKeyPair('RS256')).privateKey
      : keys.privateKey;
    const token = await new SignJWT({
      iss: GOOGLE_ISSUER,
      aud: 'test-client',
      sub: 'google-sub',
      iat: now,
      exp: now + 300,
      nonce: checks.nonce,
      email: 'Owner@gmail.com',
      email_verified: true,
      ...overrides,
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'test' })
      .sign(signingKey);
    return Response.json({ access_token: 'synthetic', token_type: 'Bearer', id_token: token });
  };
  return exchangeGoogleCode(
    new URL(
      `https://app.example/api/auth/google/callback?code=synthetic&state=${options.state ?? checks.state}`
    ),
    checks,
    config
  );
}

test('validates a signed ID token and normalizes email, preserves sub', async () => {
  expect(await run()).toMatchObject({
    providerAccountId: 'google-sub',
    email: 'owner@gmail.com',
    authoritativeEmail: true,
  });
});
test.each([
  { nonce: 'wrong' },
  { iss: 'https://evil.example' },
  { aud: 'other-client' },
  { azp: 'other-client' },
  { aud: ['test-client', 'other-client'], azp: 'other-client' },
  { exp: 1 },
  { sub: '' },
  { email_verified: false },
  { email_verified: 'true' },
  { email: 123 },
  { email: 'invalid' },
])('rejects invalid claims %j', async (claims) => {
  await expect(run(claims)).rejects.toThrow();
});
test.each([{ badSignature: true }, { pkce: true }, { state: 'changed' }, { malformed: true }])(
  'rejects signature, PKCE, state and malformed response %j',
  async (options) => {
    await expect(run({}, options)).rejects.toThrow();
  }
);
test('third party verified email is not proof of current mailbox ownership', async () => {
  expect(await run({ email: 'owner@example.com' })).toMatchObject({ authoritativeEmail: false });
  expect(await run({ email: 'owner@example.com', hd: 'example.com' })).toMatchObject({
    authoritativeEmail: true,
  });
});

test('authorization uses S256, state, nonce and minimal scopes without offline/consent', async () => {
  const config = new oidc.Configuration(
    {
      issuer: GOOGLE_ISSUER,
      authorization_endpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    },
    'test-client'
  );
  const url = await getGoogleOAuthUrl(checks, config);
  expect(url.searchParams.get('code_challenge')).toBe(
    await oidc.calculatePKCECodeChallenge(checks.codeVerifier)
  );
  expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  expect(url.searchParams.get('nonce')).toBe(checks.nonce);
  expect(url.searchParams.get('state')).toBe(checks.state);
  expect(url.searchParams.get('scope')).toBe('openid email profile');
  expect(url.searchParams.has('access_type')).toBe(false);
  expect(url.searchParams.has('prompt')).toBe(false);
});
