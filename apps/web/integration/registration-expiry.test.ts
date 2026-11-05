import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, expect, test, vi } from 'vitest';
import { prisma } from '@lyamo/database';
import { deleteExpiredRegistrations } from '@web/features/auth/services/registration-cleanup.service';
import {
  verifyEmailWithToken,
  createAndSendEmailVerification,
} from '@web/features/auth/services/password-reset.service';
import { hashToken } from '@web/features/auth/lib/tokens';
import { POST as register } from '@web/app/api/auth/register/route';
import { GET as cleanup } from '@web/app/api/cron/delete-unverified-accounts/route';

vi.mock('@web/features/auth/services/auth-email.service', () => ({
  sendEmailVerificationEmail: vi.fn(async () => true),
  sendPasswordResetEmail: vi.fn(async () => true),
}));
const target = new URL(process.env.DATABASE_URL ?? 'http://invalid');
if (
  process.env.LYAMO_TEST_ENV !== '1' ||
  target.hostname !== '127.0.0.1' ||
  target.pathname !== '/lyamo_security_test' ||
  target.username !== 'lyamo_test'
)
  throw new Error('Use isolated integration runner');
const ids: string[] = [];
afterEach(async () => {
  await prisma.user.deleteMany({ where: { id: { in: ids.splice(0) } } });
});
afterAll(() => prisma.$disconnect());
async function fixture(data: Record<string, unknown> = {}) {
  const id = randomUUID();
  ids.push(id);
  return prisma.user.create({
    data: {
      id,
      email: `expiry-${id}@example.invalid`,
      passwordHash: 'synthetic-password-hash',
      registrationExpiresAt: new Date(Date.now() - 60_000),
      ...data,
    },
  });
}
async function tokenFor(userId: string) {
  const token = randomUUID();
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 3600_000),
    },
  });
  return token;
}

test('deletes only expired new empty registrations; legacy, verified, Google, paid and data-bearing accounts survive', async () => {
  const expired = await fixture();
  await tokenFor(expired.id);
  const kept = await Promise.all([
    fixture({ registrationExpiresAt: null }),
    fixture({ registrationExpiresAt: new Date(Date.now() + 3600_000) }),
    fixture({ emailVerifiedAt: new Date() }),
    fixture({ stripeCustomerId: `synthetic-${randomUUID()}` }),
    fixture({ accounts: { create: { provider: 'google', providerAccountId: randomUUID() } } }),
    fixture({ chatMessages: { create: { role: 'user', content: 'synthetic' } } }),
  ]);
  expect(await deleteExpiredRegistrations()).toBe(1);
  expect(await prisma.user.findUnique({ where: { id: expired.id } })).toBeNull();
  expect(await prisma.emailVerificationToken.count({ where: { userId: expired.id } })).toBe(0);
  expect(await prisma.user.count({ where: { id: { in: kept.map((user) => user.id) } } })).toBe(
    kept.length
  );
  expect(await deleteExpiredRegistrations()).toBe(0);
});

test('verification clears expiry and cleanup cannot delete the confirmed account', async () => {
  const user = await fixture({ registrationExpiresAt: new Date(Date.now() + 3600_000) });
  expect(await verifyEmailWithToken(await tokenFor(user.id))).toBe(true);
  const confirmed = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  expect(confirmed.registrationExpiresAt).toBeNull();
  expect(confirmed.emailVerifiedAt).toBeTruthy();
  expect(await deleteExpiredRegistrations(new Date(Date.now() + 7 * 86400_000))).toBe(0);
});

test('expired registrations cannot be confirmed or extend their deadline by resending', async () => {
  const user = await fixture();
  expect(await verifyEmailWithToken(await tokenFor(user.id))).toBe(false);
  await createAndSendEmailVerification(user.id, user.email);
  expect(await prisma.emailVerificationToken.count({ where: { userId: user.id } })).toBe(1);
  expect(
    (await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).registrationExpiresAt
  ).toEqual(user.registrationExpiresAt);
});

test('concurrent verification and cleanup cannot delete an account whose verification succeeded', async () => {
  const user = await fixture({ registrationExpiresAt: new Date(Date.now() + 3600_000) });
  const token = await tokenFor(user.id);
  const [verified] = await Promise.all([
    verifyEmailWithToken(token),
    deleteExpiredRegistrations(new Date(Date.now() + 7200_000)),
  ]);
  const remaining = await prisma.user.findUnique({ where: { id: user.id } });
  if (verified) {
    expect(remaining?.emailVerifiedAt).toBeTruthy();
    expect(remaining?.registrationExpiresAt).toBeNull();
  } else expect(remaining).toBeNull();
});

test('new registration API enrolls a 72-hour deadline and caps resend token expiry', async () => {
  const id = randomUUID();
  const email = `register-${id}@example.invalid`;
  try {
    const started = Date.now();
    const response = await register(
      new Request(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: 'Synthetic123!',
          confirmPassword: 'Synthetic123!',
          acceptedLegal: true,
        }),
      })
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(new Date(body.registrationExpiresAt).getTime()).toBeGreaterThanOrEqual(
      started + 72 * 3600_000
    );
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    await prisma.user.update({
      where: { id: user.id },
      data: { registrationExpiresAt: new Date(Date.now() + 60_000) },
    });
    await createAndSendEmailVerification(user.id, email);
    const latest = await prisma.emailVerificationToken.findFirstOrThrow({
      where: { userId: user.id },
    });
    expect(latest.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 60_000);
  } finally {
    await prisma.user.deleteMany({ where: { email } });
  }
});

test('cleanup endpoint rejects missing authorization', async () => {
  expect(
    (await cleanup(new Request('http://localhost/api/cron/delete-unverified-accounts'))).status
  ).toBe(401);
});
