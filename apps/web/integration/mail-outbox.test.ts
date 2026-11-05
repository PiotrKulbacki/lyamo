import { randomUUID } from 'node:crypto';
import { afterAll, expect, test, vi } from 'vitest';
import { prisma } from '@lyamo/database';
import {
  createAndSendPasswordReset,
  resetPasswordWithToken,
} from '@web/features/auth/services/password-reset.service';
import {
  deliverMailJob,
  processMailOutbox,
} from '@web/features/email/services/mail-outbox.service';

const sender = vi.hoisted(() => vi.fn());
const queueSend = vi.hoisted(() => vi.fn());
vi.mock('@vercel/queue', () => ({ send: queueSend }));
vi.mock('@web/features/email/services/brevo.service', () => ({ sendTransactionalEmail: sender }));
const target = new URL(process.env.DATABASE_URL ?? 'http://invalid');
if (
  process.env.LYAMO_TEST_ENV !== '1' ||
  target.hostname !== '127.0.0.1' ||
  target.pathname !== '/lyamo_security_test' ||
  target.username !== 'lyamo_test'
)
  throw new Error('Use isolated runner');
afterAll(() => prisma.$disconnect());

test('outbox preserves links through failures, serializes resend and bounds retries', async () => {
  const id = randomUUID();
  const email = `mail-${id}@example.invalid`;
  await prisma.user.create({
    data: { id, email, passwordHash: 'synthetic-hash', emailVerifiedAt: new Date() },
  });
  try {
    sender.mockReset().mockResolvedValue({ ok: false, error: 'failure' });
    await Promise.all(
      Array.from({ length: 8 }, () => createAndSendPasswordReset(email, { locale: 'en' }))
    );
    expect(await prisma.passwordResetToken.count({ where: { userId: id } })).toBe(1);
    const job = await prisma.mailJob.findFirstOrThrow({ where: { userId: id, kind: 'reset' } });
    expect(job.attempts).toBe(1);
    expect(job.payload).toBeTruthy();
    expect(job.payload).not.toContain(email);
    const originalMail = sender.mock.calls[0][0] as { text: string; idempotencyKey: string };
    const token = new URL(
      originalMail.text.match(/https?:\/\/\S+\/reset-password#token=\S+/)![0]
    ).hash.slice(7);
    expect(job.payload).not.toContain(token);
    await prisma.mailJob.update({
      where: { id: job.id },
      data: { createdAt: new Date(Date.now() - 120_000) },
    });
    await createAndSendPasswordReset(email);
    expect(await prisma.passwordResetToken.count({ where: { userId: id } })).toBe(2);
    for (let i = 0; i < 5; i++) {
      await prisma.mailJob.update({ where: { id: job.id }, data: { nextAttemptAt: new Date(0) } });
      await Promise.all([deliverMailJob(job.id), deliverMailJob(job.id)]);
    }
    const finished = await prisma.mailJob.findUniqueOrThrow({ where: { id: job.id } });
    expect(finished.attempts).toBe(5);
    expect(finished.payload).toBeNull();
    expect(sender.mock.calls.filter(([params]) => params.idempotencyKey === job.id)).toHaveLength(
      5
    );
    expect(await resetPasswordWithToken(token, 'replacement-hash')).toBe(true);
    expect(await resetPasswordWithToken(token, 'another-hash')).toBe(false);
    await processMailOutbox();
  } finally {
    await prisma.user.deleteMany({ where: { id } });
  }
});

test('retry succeeds with the same idempotency key and clears the encrypted payload', async () => {
  const id = randomUUID();
  const email = `retry-${id}@example.invalid`;
  await prisma.user.create({
    data: { id, email, passwordHash: 'synthetic-hash', emailVerifiedAt: new Date() },
  });
  try {
    sender.mockReset().mockResolvedValueOnce({ ok: false }).mockResolvedValue({ ok: true });
    await createAndSendPasswordReset(email, { locale: 'de' });
    const job = await prisma.mailJob.findFirstOrThrow({ where: { userId: id, kind: 'reset' } });
    await prisma.mailJob.update({ where: { id: job.id }, data: { nextAttemptAt: new Date(0) } });
    await deliverMailJob(job.id);
    const completed = await prisma.mailJob.findUniqueOrThrow({ where: { id: job.id } });
    expect(completed.attempts).toBe(2);
    expect(completed.payload).toBeNull();
    expect(completed.completedAt).toBeTruthy();
    expect(sender.mock.calls[0][0].idempotencyKey).toBe(sender.mock.calls[1][0].idempotencyKey);
  } finally {
    await prisma.user.deleteMany({ where: { id } });
  }
});

test('queue publication failure rolls back the new link and preserves an earlier link', async () => {
  const id = randomUUID();
  const email = `queue-${id}@example.invalid`;
  await prisma.user.create({
    data: { id, email, passwordHash: 'synthetic-hash', emailVerifiedAt: new Date() },
  });
  try {
    sender.mockReset().mockResolvedValue({ ok: true });
    await createAndSendPasswordReset(email);
    const link = sender.mock.calls[0][0].text.match(/https?:\/\/\S+\/reset-password#token=\S+/)[0];
    const token = new URL(link).hash.slice(7);
    await prisma.mailJob.updateMany({
      where: { userId: id },
      data: { createdAt: new Date(Date.now() - 120_000) },
    });
    queueSend.mockRejectedValueOnce(new Error('queue unavailable'));
    process.env.VERCEL_ENV = 'production';
    await expect(createAndSendPasswordReset(email)).rejects.toThrow();
    delete process.env.VERCEL_ENV;
    expect(await prisma.passwordResetToken.count({ where: { userId: id } })).toBe(1);
    expect(await resetPasswordWithToken(token, 'replacement-hash')).toBe(true);
  } finally {
    delete process.env.VERCEL_ENV;
    await prisma.user.deleteMany({ where: { id } });
  }
});
