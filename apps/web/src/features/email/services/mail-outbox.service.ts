import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';
import { prisma, type Prisma } from '@lyamo/database';
import { send } from '@vercel/queue';
import { env } from '@web/env';
import { buildResetPasswordEmail } from '@web/features/email/templates/reset-password';
import { buildVerifyEmail } from '@web/features/email/templates/verify-email';
import { sendTransactionalEmail } from './brevo.service';
import { hashToken } from '@web/features/auth/lib/tokens';

type Payload = {
  token?: string;
  locale?: string | null;
  name?: string | null;
  registrationExpiresAt?: string | null;
  event?: string;
};
const JOB_TTL = 25 * 60_000; // Brevo's idempotency window is 30 minutes.
const COOLDOWN = 60_000;
const LEASE = 30_000;
const MAX_ATTEMPTS = 5;

function key() {
  return createHash('sha256').update('lyamo-mail-outbox-v1\0').update(env.AUTH_SECRET).digest();
}
function encrypt(payload: Payload) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString('base64url')).join('.');
}
function decrypt(value: string): Payload {
  const [iv, tag, ciphertext] = value.split('.').map((part) => Buffer.from(part, 'base64url'));
  const decipher = createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return JSON.parse(
    Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
  ) as Payload;
}

export async function enqueueMail(
  tx: Prisma.TransactionClient,
  userId: string,
  kind: string,
  payload: Payload
) {
  const now = new Date();
  const id = randomUUID();
  await tx.mailJob.create({
    data: {
      id,
      userId,
      kind,
      payload: encrypt(payload),
      expiresAt: new Date(now.getTime() + JOB_TTL),
    },
  });
  // Publish before commit: a publish failure rolls the transaction back. An early
  // delivery retries until the row is visible, so a committed job has a wakeup.
  if (process.env.VERCEL_ENV === 'production') {
    await send(
      'security-mail',
      { id },
      { idempotencyKey: id, retentionSeconds: JOB_TTL / 1000, delaySeconds: 10 }
    );
  }
  return id;
}

// Called while holding the user row lock, serializing concurrent resend requests.
export async function mailIsCoolingDown(
  tx: Prisma.TransactionClient,
  userId: string,
  kind: string
) {
  return Boolean(
    await tx.mailJob.findFirst({
      where: { userId, kind, createdAt: { gt: new Date(Date.now() - COOLDOWN) } },
      select: { id: true },
    })
  );
}

const notice: Record<string, { subject: string; text: string }> = {
  pl: {
    subject: 'Powiadomienie o bezpieczeństwie konta Lyamo',
    text: 'Wykryliśmy zmianę dotyczącą bezpieczeństwa Twojego konta. Sprawdź szczegóły w ustawieniach bezpieczeństwa Lyamo.',
  },
  en: {
    subject: 'Lyamo account security notice',
    text: 'A security change occurred on your account. Review the details in your Lyamo security settings.',
  },
  de: {
    subject: 'Sicherheitshinweis zu Ihrem Lyamo-Konto',
    text: 'Bei Ihrem Konto gab es eine sicherheitsrelevante Änderung. Prüfen Sie die Details in Ihren Lyamo-Sicherheitseinstellungen.',
  },
  es: {
    subject: 'Aviso de seguridad de tu cuenta Lyamo',
    text: 'Se ha producido un cambio de seguridad en tu cuenta. Consulta los detalles en los ajustes de seguridad de Lyamo.',
  },
};

export async function deliverMailJob(id: string) {
  const now = new Date();
  const leaseUntil = new Date(now.getTime() + LEASE);
  const claim = await prisma.mailJob.updateMany({
    where: {
      id,
      payload: { not: null },
      completedAt: null,
      expiresAt: { gt: now },
      nextAttemptAt: { lte: now },
      attempts: { lt: MAX_ATTEMPTS },
      OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }],
    },
    data: { lockedUntil: leaseUntil, attempts: { increment: 1 } },
  });
  if (!claim.count) return;
  const job = await prisma.mailJob.findUnique({ where: { id }, include: { user: true } });
  if (!job?.payload) return;
  let ok = false;
  try {
    const payload = decrypt(job.payload);
    if (payload.token && (job.kind === 'reset' || job.kind === 'verify')) {
      const where = {
        tokenHash: hashToken(payload.token),
        userId: job.userId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      };
      const active =
        job.kind === 'reset'
          ? await prisma.passwordResetToken.findFirst({ where, select: { id: true } })
          : await prisma.emailVerificationToken.findFirst({ where, select: { id: true } });
      if (!active) {
        await prisma.mailJob.updateMany({
          where: { id, lockedUntil: leaseUntil },
          data: { payload: null, lockedUntil: null, completedAt: new Date() },
        });
        return;
      }
    }
    let copy: { subject: string; text: string; html: string };
    if (job.kind === 'reset' && payload.token)
      copy = buildResetPasswordEmail({
        token: payload.token,
        locale: payload.locale,
        name: payload.name,
      });
    else if (job.kind === 'verify' && payload.token)
      copy = buildVerifyEmail({
        token: payload.token,
        locale: payload.locale,
        name: payload.name,
        registrationExpiresAt: payload.registrationExpiresAt
          ? new Date(payload.registrationExpiresAt)
          : null,
      });
    else if (job.kind === 'security') {
      const message = notice[payload.locale ?? 'en'] ?? notice.en;
      copy = { ...message, html: `<p>${message.text}</p>` };
    } else throw new Error('Invalid mail job');
    const result = await sendTransactionalEmail({
      to: job.user.email,
      ...copy,
      idempotencyKey: id,
    });
    ok = result.ok;
  } catch {
    // Do not log decrypted content or provider errors.
  }
  const terminal = ok || job.attempts >= MAX_ATTEMPTS || Date.now() >= job.expiresAt.getTime();
  await prisma.mailJob.updateMany({
    where: { id, lockedUntil: leaseUntil, completedAt: null },
    data: terminal
      ? { payload: null, lockedUntil: null, completedAt: new Date() }
      : {
          lockedUntil: null,
          nextAttemptAt: new Date(
            Date.now() + Math.min(2 ** (job.attempts - 1) * 60_000, 8 * 60_000)
          ),
        },
  });
}

export async function processMailOutbox() {
  const now = new Date();
  await prisma.mailJob.updateMany({
    where: { expiresAt: { lte: now }, payload: { not: null } },
    data: { payload: null, completedAt: now, lockedUntil: null },
  });
  await prisma.mailJob.deleteMany({
    where: { completedAt: { lt: new Date(now.getTime() - 7 * 86400_000) } },
  });
  const jobs = await prisma.mailJob.findMany({
    where: {
      payload: { not: null },
      completedAt: null,
      nextAttemptAt: { lte: now },
      expiresAt: { gt: now },
    },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });
  await Promise.all(jobs.map(({ id }) => deliverMailJob(id)));
}
