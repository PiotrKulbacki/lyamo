import { randomUUID } from 'node:crypto';
import { afterAll, expect, test, vi } from 'vitest';
import { prisma } from '@lyamo/database';
import { hashToken } from '@web/features/auth/lib/tokens';
import { GET } from '@web/app/api/auth/google/callback/route';

const google = vi.hoisted(() => ({ providerAccountId: '', email: '' }));
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => ({ value: 'synthetic-state' }) }),
}));
vi.mock('@web/features/auth/lib/tokens', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@web/features/auth/lib/tokens')>()),
  exchangeGoogleCode: vi.fn(async () => ({ ...google, name: null, avatarUrl: null })),
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

test('successful Google callback creates a valid session and lands directly in the dashboard', async () => {
  const id = randomUUID();
  google.providerAccountId = id;
  google.email = `google-${id}@example.invalid`;
  await prisma.user.create({
    data: {
      id,
      email: google.email,
      emailVerifiedAt: new Date(),
      accounts: { create: { provider: 'google', providerAccountId: id } },
    },
  });
  try {
    const response = await GET(
      new Request(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback?code=synthetic&state=synthetic-state`
      )
    );
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`);
    const cookie = response.cookies.get('sec_session');
    expect(cookie?.value).toBeTruthy();
    const session = await prisma.session.findUnique({
      where: { token: hashToken(cookie!.value) },
    });
    expect(session?.userId).toBe(id);
    expect(session!.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(response.cookies.get('sec_oauth_state')?.maxAge).toBe(0);
  } finally {
    await prisma.user.delete({ where: { id } });
  }
});
