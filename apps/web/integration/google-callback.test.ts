import { randomUUID } from 'node:crypto';
import { afterAll, beforeEach, expect, test, vi } from 'vitest';
import { prisma } from '@lyamo/database';
import { hashToken } from '@web/features/auth/lib/tokens';
import { GET } from '@web/app/api/auth/google/callback/route';
import { createGoogleSession } from '@web/features/auth/services/google-auth.service';
import { findUserByEmail } from '@web/features/auth/services/email-identity.service';
import { POST as login } from '@web/app/api/auth/login/route';
import { hashSync } from 'bcryptjs';

const google = vi.hoisted(() => ({ providerAccountId: '', email: '', authoritativeEmail: true }));
const browser = vi.hoisted(() => ({ state: '' }));
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => ({ value: browser.state }) }),
}));
vi.mock('@web/features/auth/lib/google-oidc', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@web/features/auth/lib/google-oidc')>()),
  exchangeGoogleCode: vi.fn(async (url: URL) => {
    if (url.searchParams.has('error')) throw new Error('ACCESS_DENIED');
    return { ...google, name: null, avatarUrl: null };
  }),
}));
const target = new URL(process.env.DATABASE_URL ?? 'http://invalid');
if (
  process.env.LYAMO_TEST_ENV !== '1' ||
  target.hostname !== '127.0.0.1' ||
  target.pathname !== '/lyamo_security_test' ||
  target.username !== 'lyamo_test' ||
  process.env.DIRECT_DATABASE_URL !== process.env.DATABASE_URL
) {
  throw new Error('Use the isolated integration runner');
}
afterAll(() => prisma.$disconnect());
beforeEach(() => {
  google.providerAccountId = randomUUID();
  google.email = `google-${google.providerAccountId}@gmail.com`;
  google.authoritativeEmail = true;
  browser.state = randomUUID();
});
async function start(expiresAt = new Date(Date.now() + 60_000)) {
  await prisma.oAuthAttempt.create({
    data: {
      stateHash: hashToken(browser.state),
      nonce: 'nonce',
      codeVerifier: 'verifier',
      expiresAt,
    },
  });
}
const callback = (query = '') =>
  GET(
    new Request(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback?code=synthetic&state=${browser.state}${query}`
    )
  );
async function cleanup() {
  await prisma.user.deleteMany({ where: { email: google.email } });
  await prisma.oAuthAttempt.deleteMany({ where: { stateHash: hashToken(browser.state) } });
}

test('new Google user: concurrent callbacks claim state once and create one valid session', async () => {
  await start();
  try {
    const results = await Promise.all([callback(), callback()]);
    const successes = results.filter((r) => r.cookies.has('sec_session'));
    expect(successes).toHaveLength(1);
    const response = successes[0]!;
    expect(response.headers.get('location')).toBe(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`);
    const session = await prisma.session.findUnique({
      where: {
        token: hashToken(response.cookies.get('sec_session')!.value),
      },
      include: { user: true },
    });
    expect(session?.user.email).toBe(google.email);
    expect(session?.user.passwordHash).toBeNull();
    expect(response.cookies.get('sec_oauth_state')?.maxAge).toBe(0);
    expect((await callback()).cookies.has('sec_session')).toBe(false);
  } finally {
    await cleanup();
  }
});

test.each([false, true])(
  'local account verified=%s: Google never activates or links an existing password',
  async (verified) => {
    const passwordHash = hashSync('Attacker123!', 4);
    const user = await prisma.user.create({
      data: {
        email: google.email,
        passwordHash,
        emailVerifiedAt: verified ? new Date() : null,
      },
    });
    await start();
    try {
      const response = await callback();
      expect(response.cookies.has('sec_session')).toBe(false);
      expect(response.headers.get('location')).toContain('oauthAccountExists');
      const unchanged = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      expect(unchanged.passwordHash).toBe(passwordHash);
      expect(Boolean(unchanged.emailVerifiedAt)).toBe(verified);
      expect(await prisma.account.count({ where: { userId: user.id } })).toBe(0);
      expect(await prisma.session.count({ where: { userId: user.id } })).toBe(0);
      const localLogin = await login(
        new Request(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: google.email, password: 'Attacker123!' }),
        })
      );
      expect(localLogin.status).toBe(verified ? 200 : 403);
      expect(localLogin.cookies.has('sec_session')).toBe(verified);
    } finally {
      await cleanup();
    }
  }
);

test('independent simultaneous logins for the same new sub resolve unique races', async () => {
  try {
    const profile = { ...google, name: null, avatarUrl: null };
    const tokens = await Promise.all([createGoogleSession(profile), createGoogleSession(profile)]);
    expect(tokens).toHaveLength(2);
    expect(await prisma.user.count({ where: { email: google.email } })).toBe(1);
    expect(
      await prisma.account.count({ where: { providerAccountId: google.providerAccountId } })
    ).toBe(1);
  } finally {
    await cleanup();
  }
});

test.each(['expired', 'changed', 'denied'])(
  'invalid callback %s never creates a session',
  async (kind) => {
    await start(kind === 'expired' ? new Date(0) : undefined);
    if (kind === 'changed') browser.state += 'changed';
    try {
      const response = await callback(kind === 'denied' ? '&error=access_denied' : '');
      expect(response.cookies.has('sec_session')).toBe(false);
      expect(await prisma.user.count({ where: { email: google.email } })).toBe(0);
    } finally {
      if (kind === 'changed') browser.state = browser.state.replace('changed', '');
      await cleanup();
    }
  }
);

test('third party Google email requires independent local mailbox verification', async () => {
  google.authoritativeEmail = false;
  await start();
  try {
    expect((await callback()).cookies.has('sec_session')).toBe(false);
    expect(await prisma.user.count({ where: { email: google.email } })).toBe(0);
  } finally {
    await cleanup();
  }
});

test('legacy spelling works; normalized unique index blocks a competing registration', async () => {
  const original = google.email.toUpperCase();
  const user = await prisma.user.create({ data: { email: original } });
  try {
    expect((await findUserByEmail(` ${google.email} `))?.id).toBe(user.id);
    await expect(prisma.user.create({ data: { email: google.email } })).rejects.toThrow();
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).email).toBe(original);
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
  }
});

test('different Google subjects competing for one email never merge accounts', async () => {
  try {
    const profile = { ...google, name: null, avatarUrl: null };
    const results = await Promise.allSettled([
      createGoogleSession(profile),
      createGoogleSession({ ...profile, providerAccountId: randomUUID() }),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: google.email } });
    expect(await prisma.account.count({ where: { userId: user.id } })).toBe(1);
  } finally {
    await cleanup();
  }
});
