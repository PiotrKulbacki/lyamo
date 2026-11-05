import { randomUUID } from 'node:crypto';
import { afterAll, expect, test } from 'vitest';
import { prisma } from '@lyamo/database';
import { claimAuthBudget } from '@web/features/auth/services/auth-throttle.service';
import { checkAuthRateLimit } from '@web/lib/rate-limit';
const target = new URL(process.env.DATABASE_URL ?? 'http://invalid');
if (
  process.env.LYAMO_TEST_ENV !== '1' ||
  target.hostname !== '127.0.0.1' ||
  target.pathname !== '/lyamo_security_test' ||
  target.username !== 'lyamo_test'
)
  throw new Error('Use isolated integration runner');
afterAll(() => prisma.$disconnect());
test('PostgreSQL admits exactly the budget under concurrent claims and recovers after expiry', async () => {
  const key = `synthetic-${randomUUID()}`;
  try {
    const results = await Promise.all(
      Array.from({ length: 25 }, () => claimAuthBudget(key, 5, 60000))
    );
    expect(results.filter((result) => result.allowed)).toHaveLength(5);
    expect(new Set(results.map((result) => result.reset)).size).toBe(1);
    await prisma.authRateBucket.update({ where: { key }, data: { expiresAt: new Date(0) } });
    expect((await claimAuthBudget(key, 5, 60000)).allowed).toBe(true);
    expect((await prisma.authRateBucket.findUniqueOrThrow({ where: { key } })).count).toBe(1);
  } finally {
    await prisma.authRateBucket.deleteMany({ where: { key } });
  }
});
test('missing Redis uses real database: rotating IP does not bypass mailbox budget', async () => {
  const email = `${randomUUID()}@example.invalid`;
  const results = [];
  for (let i = 0; i < 7; i++)
    results.push(
      await checkAuthRateLimit(
        new Request('https://local.invalid', {
          headers: { 'x-forwarded-for': `192.0.2.${i}` },
        }),
        i < 3 ? 'register' : 'forgot-password',
        email
      )
    );
  expect(results.slice(0, 6).every((result) => result.allowed)).toBe(true);
  expect(results[6].allowed).toBe(false);
  expect(await prisma.authRateBucket.count({ where: { key: { contains: email } } })).toBe(0);
});
