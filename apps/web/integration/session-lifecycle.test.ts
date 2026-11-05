import { randomUUID } from 'node:crypto';
import { afterAll, expect, test, vi } from 'vitest';
import { prisma } from '@lyamo/database';
import {
  createMobileTokens,
  createWebSession,
  getUserFromBearerToken,
} from '@web/features/auth/services/auth.service';
import {
  rotateRefreshToken,
  revokeOwnedSessions,
  REFRESH_RETRY_MS,
} from '@web/features/auth/services/session-lifecycle.service';
import { resetPasswordWithToken } from '@web/features/auth/services/password-reset.service';
import { hashToken, verifyAccessClaims } from '@web/features/auth/lib/tokens';
import { POST as refresh } from '@web/app/api/auth/refresh/route';
import { GET as me, DELETE as deleteAccount } from '@web/app/api/auth/me/route';
import { GET as sessions, DELETE as revoke } from '@web/app/api/auth/sessions/route';
import { POST as changePassword } from '@web/app/api/auth/change-password/route';
import { POST as reauth } from '@web/app/api/auth/reauth/route';
import { hashSync } from 'bcryptjs';
async function rotate(raw: string) {
  const result = await rotateRefreshToken(raw);
  if (result && 'conflict' in result) throw new Error('Unexpected refresh conflict');
  return result;
}
const browser = vi.hoisted(() => ({ token: '' }));
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => ({ value: browser.token }) }),
}));
vi.mock('@web/features/scanner/services/receipt-storage.service', () => ({
  deleteAllUserReceiptImages: vi.fn(),
}));
const target = new URL(process.env.DATABASE_URL!);
if (
  process.env.LYAMO_TEST_ENV !== '1' ||
  target.hostname !== '127.0.0.1' ||
  target.pathname !== '/lyamo_security_test' ||
  target.username !== 'lyamo_test'
)
  throw new Error('Use isolated runner');
afterAll(() => prisma.$disconnect());
const password = 'Synthetic-S03-password-123!';
const request = (path: string, token?: string, body?: object, method = 'POST') =>
  new Request(`http://localhost/api/auth/${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
async function fixture(run: (id: string) => Promise<void>) {
  const id = randomUUID();
  await prisma.user.create({
    data: {
      id,
      email: `s03-${id}@example.invalid`,
      emailVerifiedAt: new Date(),
      passwordHash: hashSync(password, 4),
    },
  });
  try {
    await run(id);
  } finally {
    browser.token = '';
    await prisma.user.deleteMany({ where: { id } });
  }
}

test('PostgreSQL refresh races return one successor, lost delivery retries, late replay revokes JWT family', async () =>
  fixture(async (id) => {
    const initial = await createMobileTokens(id);
    const results = await Promise.all(
      Array.from({ length: 8 }, () => rotate(initial.refreshToken))
    );
    expect(results.every(Boolean)).toBe(true);
    expect(new Set(results.map((r) => r!.refreshToken)).size).toBe(1);
    expect(await prisma.refreshToken.count({ where: { userId: id } })).toBe(2);
    expect((await rotate(initial.refreshToken))?.refreshToken).toBe(results[0]!.refreshToken);
    await prisma.refreshToken.update({
      where: { token: hashToken(initial.refreshToken) },
      data: { consumedAt: new Date(Date.now() - REFRESH_RETRY_MS - 1) },
    });
    expect(await rotate(initial.refreshToken)).toBeNull();
    expect(await getUserFromBearerToken(`Bearer ${initial.accessToken}`)).toBeNull();
    expect(await rotate(results[0]!.refreshToken)).toBeNull();
    expect(await prisma.securityEvent.count({ where: { userId: id, kind: 'refresh_reuse' } })).toBe(
      1
    );
  }));

test('reset is single-use under concurrency and rejects pre-reset web cookie and valid access JWT at actual API', async () =>
  fixture(async (id) => {
    browser.token = await createWebSession(id);
    const mobile = await createMobileTokens(id);
    const token = randomUUID();
    await prisma.passwordResetToken.create({
      data: { userId: id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 60000) },
    });
    expect((await me(request('me', mobile.accessToken, undefined, 'GET'))).status).toBe(200);
    const resets = await Promise.all([
      resetPasswordWithToken(token, hashSync('new-password', 4)),
      resetPasswordWithToken(token, hashSync('another-password', 4)),
    ]);
    expect(resets.filter(Boolean)).toHaveLength(1);
    expect((await me(request('me', mobile.accessToken, undefined, 'GET'))).status).toBe(401);
    expect((await me(request('me', undefined, undefined, 'GET'))).status).toBe(401);
    expect(
      (await refresh(request('refresh', undefined, { refreshToken: mobile.refreshToken }))).status
    ).toBe(401);
  }));

test('session ownership, logout, idle/absolute expiry and required verified user are enforced', async () =>
  fixture(async (id) => {
    const first = await createMobileTokens(id);
    const second = await createMobileTokens(id);
    const sid = (await verifyAccessClaims(second.accessToken))!.sid;
    const otherId = randomUUID();
    await prisma.user.create({
      data: {
        id: otherId,
        email: `s03-other-${otherId}@example.invalid`,
        emailVerifiedAt: new Date(),
      },
    });
    try {
      const other = await createMobileTokens(otherId);
      expect(
        (await revoke(request('sessions', other.accessToken, { id: sid }, 'DELETE'))).status
      ).toBe(404);
      const list = await (
        await sessions(request('sessions', other.accessToken, undefined, 'GET'))
      ).json();
      expect(list.sessions.some((s: { id: string }) => s.id === sid)).toBe(false);
      await revokeOwnedSessions(id, sid);
      expect(await getUserFromBearerToken(`Bearer ${second.accessToken}`)).toBeNull();
      expect(await getUserFromBearerToken(`Bearer ${first.accessToken}`)).not.toBeNull();
      const own = (await verifyAccessClaims(first.accessToken))!.sid;
      await prisma.session.update({ where: { id: own }, data: { lastSeenAt: new Date(0) } });
      expect(await getUserFromBearerToken(`Bearer ${first.accessToken}`)).toBeNull();
      await prisma.session.update({
        where: { id: own },
        data: { lastSeenAt: new Date(), expiresAt: new Date(0) },
      });
      expect(await rotate(first.refreshToken)).toBeNull();
      await prisma.session.update({
        where: { id: own },
        data: { expiresAt: new Date(Date.now() + 60000) },
      });
      await prisma.user.update({ where: { id }, data: { emailVerifiedAt: null } });
      expect(await getUserFromBearerToken(`Bearer ${first.accessToken}`)).toBeNull();
    } finally {
      await prisma.user.delete({ where: { id: otherId } });
    }
  }));

test('password change replaces current mobile credentials and revokes every old session', async () =>
  fixture(async (id) => {
    const current = await createMobileTokens(id);
    browser.token = await createWebSession(id);
    const next = 'New-S03-password-456!';
    const response = await changePassword(
      new Request('http://localhost/api/auth/change-password', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-client-platform': 'mobile',
          authorization: `Bearer ${current.accessToken}`,
        },
        body: JSON.stringify({
          currentPassword: password,
          newPassword: next,
          confirmPassword: next,
        }),
      })
    );
    expect(response.status).toBe(200);
    const replacement = await response.json();
    expect(await getUserFromBearerToken(`Bearer ${current.accessToken}`)).toBeNull();
    browser.token = '';
    expect(await getUserFromBearerToken(`Bearer ${replacement.accessToken}`)).not.toBeNull();
    expect(await rotate(current.refreshToken)).toBeNull();
    expect(await rotate(replacement.refreshToken)).not.toBeNull();
  }));

test('deletion requires fresh authentication, wrong password and stale/revoked sessions cannot elevate', async () =>
  fixture(async (id) => {
    const mobile = await createMobileTokens(id);
    const sid = (await verifyAccessClaims(mobile.accessToken))!.sid;
    await prisma.session.update({ where: { id: sid }, data: { authenticatedAt: null } });
    expect(
      (await deleteAccount(request('me', mobile.accessToken, undefined, 'DELETE'))).status
    ).toBe(403);
    expect(
      (await reauth(request('reauth', mobile.accessToken, { password: 'wrong' }))).status
    ).toBe(401);
    expect((await reauth(request('reauth', mobile.accessToken, { password }))).status).toBe(200);
    expect(
      (await deleteAccount(request('me', mobile.accessToken, undefined, 'DELETE'))).status
    ).toBe(200);
  }));

test('legacy mobile refresh is refused and delayed duplicates never revoke an advanced family within grace', async () =>
  fixture(async (id) => {
    const legacy = randomUUID();
    await prisma.refreshToken.create({
      data: { userId: id, token: hashToken(legacy), expiresAt: new Date(Date.now() + 60000) },
    });
    expect(await rotate(legacy)).toBeNull();
    const initial = await createMobileTokens(id);
    const next = await rotate(initial.refreshToken);
    expect(await rotate(next!.refreshToken)).not.toBeNull();
    expect(await rotateRefreshToken(initial.refreshToken)).toEqual({ conflict: true });
    expect(await getUserFromBearerToken(`Bearer ${next!.accessToken}`)).not.toBeNull();
    await prisma.refreshToken.update({
      where: { token: hashToken(initial.refreshToken) },
      data: { consumedAt: new Date(Date.now() - REFRESH_RETRY_MS - 1) },
    });
    expect(await rotate(initial.refreshToken)).toBeNull();
    expect(await getUserFromBearerToken(`Bearer ${next!.accessToken}`)).toBeNull();
  }));

test('refresh racing with reset cannot leave a valid family', async () =>
  fixture(async (id) => {
    const initial = await createMobileTokens(id);
    const token = randomUUID();
    await prisma.passwordResetToken.create({
      data: { userId: id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 60000) },
    });
    const [result] = await Promise.all([
      rotate(initial.refreshToken),
      resetPasswordWithToken(token, hashSync('replacement', 4)),
    ]);
    if (result) expect(await getUserFromBearerToken(`Bearer ${result.accessToken}`)).toBeNull();
    expect(await prisma.session.count({ where: { userId: id } })).toBe(0);
  }));
