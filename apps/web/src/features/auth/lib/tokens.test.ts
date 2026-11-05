import { expect, test, vi } from 'vitest';
import { SignJWT } from 'jose';
vi.mock('@web/env', () => ({
  env: { AUTH_SECRET: 'synthetic-unit-secret-at-least-32-characters' },
}));
import { signAccessToken, verifyAccessClaims } from './tokens';
const key = new TextEncoder().encode('synthetic-unit-secret-at-least-32-characters');
test('access tokens require session, algorithm, issuer, audience, type and lifetime', async () => {
  expect(await verifyAccessClaims(await signAccessToken('user', 'session'))).toEqual({
    sub: 'user',
    sid: 'session',
  });
  expect(await verifyAccessClaims(await signAccessToken('user'))).toBeNull();
  for (const variation of ['issuer', 'audience', 'algorithm', 'expired', 'type', 'no-exp']) {
    let jwt = new SignJWT({
      sub: 'user',
      sid: 'session',
      type: variation === 'type' ? 'refresh' : 'access',
    })
      .setProtectedHeader({ alg: variation === 'algorithm' ? 'HS384' : 'HS256' })
      .setIssuer(variation === 'issuer' ? 'other' : 'lyamo')
      .setAudience(variation === 'audience' ? 'other' : 'lyamo-mobile')
      .setIssuedAt();
    if (variation !== 'no-exp') jwt = jwt.setExpirationTime(variation === 'expired' ? '0s' : '15m');
    expect(await verifyAccessClaims(await jwt.sign(key))).toBeNull();
  }
});
