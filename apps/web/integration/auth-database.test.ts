import { randomUUID } from 'node:crypto';
import { afterAll, expect, test } from 'vitest';
import { prisma } from '@lyamo/database';
import { createWebSession, revokeSession } from '@web/features/auth/services/auth.service';
import { hashToken } from '@web/features/auth/lib/tokens';

// Refuse direct invocation against an inherited developer/production connection.
const target = new URL(process.env.DATABASE_URL ?? 'http://invalid');
if (
  process.env.LYAMO_TEST_ENV !== '1' ||
  target.hostname !== '127.0.0.1' ||
  target.pathname !== '/lyamo_security_test' ||
  target.username !== 'lyamo_test' ||
  process.env.DIRECT_DATABASE_URL !== process.env.DATABASE_URL
) {
  throw new Error('Run npm run test:integration with the isolated database runner');
}

afterAll(() => prisma.$disconnect());

test('creates concurrent web sessions in PostgreSQL, revokes one and cleans up its fixture', async () => {
  const id = randomUUID();
  await prisma.user.create({
    data: { id, email: `s00-${id}@example.invalid`, emailVerifiedAt: new Date() },
  });
  try {
    const tokens = await Promise.all(Array.from({ length: 8 }, () => createWebSession(id)));
    expect(new Set(tokens).size).toBe(8);
    const sessions = await prisma.session.findMany({ where: { userId: id } });
    expect(sessions).toHaveLength(8);
    expect(new Set(sessions.map((session) => session.token))).toEqual(
      new Set(tokens.map(hashToken))
    );
    expect(sessions.every((session) => session.expiresAt > new Date())).toBe(true);

    await revokeSession(tokens[0]!);
    await revokeSession(tokens[0]!);
    expect(await prisma.session.count({ where: { userId: id } })).toBe(7);
    expect(await prisma.session.findUnique({ where: { token: hashToken(tokens[0]!) } })).toBeNull();
  } finally {
    await prisma.user.delete({ where: { id } });
  }
  expect(await prisma.session.count({ where: { userId: id } })).toBe(0);
  expect(await prisma.user.findUnique({ where: { id } })).toBeNull();
});
