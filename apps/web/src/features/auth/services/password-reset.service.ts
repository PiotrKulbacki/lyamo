import { lockUser, securityEvent } from './session-lifecycle.service';
import { findUserByEmail } from '@web/features/auth/services/email-identity.service';
import { prisma } from '@lyamo/database';
import { generateToken, hashToken } from '@web/features/auth/lib/tokens';
import {
  enqueueMail,
  deliverMailJob,
  mailIsCoolingDown,
} from '@web/features/email/services/mail-outbox.service';

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export async function createAndSendPasswordReset(
  email: string,
  options?: { locale?: string | null; queuedOnly?: boolean }
): Promise<void> {
  const user = await findUserByEmail(email);

  // Always no-op outwardly; only send when the account has a local password.
  if (!user?.passwordHash) {
    return;
  }

  const id = await prisma.$transaction(async (tx) => {
    await lockUser(tx, user.id);
    const current = await tx.user.findUnique({ where: { id: user.id } });
    if (!current?.passwordHash || (await mailIsCoolingDown(tx, user.id, 'reset'))) return null;
    const token = generateToken();
    await tx.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
    });
    return enqueueMail(tx, user.id, 'reset', {
      token,
      locale: options?.locale,
      name: current.name,
    });
  });
  if (id && !options?.queuedOnly) await deliverMailJob(id);
}

export async function resetPasswordWithToken(
  token: string,
  passwordHash: string
): Promise<boolean> {
  const tokenHash = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return false;
  }

  return prisma.$transaction(async (tx) => {
    await lockUser(tx, record.userId);
    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (claimed.count !== 1) return false;
    await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
    await tx.session.deleteMany({ where: { userId: record.userId } });
    await tx.refreshToken.deleteMany({ where: { userId: record.userId } });
    await tx.passwordResetToken.deleteMany({ where: { userId: record.userId, usedAt: null } });
    await securityEvent(tx, record.userId, 'password_reset');
    return true;
  });
}

export async function createAndSendEmailVerification(
  userId: string,
  email: string,
  options?: { locale?: string | null; name?: string | null; queuedOnly?: boolean }
): Promise<void> {
  const id = await prisma.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (
      !user ||
      user.email !== email ||
      user.emailVerifiedAt ||
      (user.registrationExpiresAt && user.registrationExpiresAt <= new Date()) ||
      (await mailIsCoolingDown(tx, userId, 'verify'))
    )
      return null;
    const token = generateToken();
    const expiresAt = new Date(
      Math.min(
        Date.now() + EMAIL_VERIFICATION_TTL_MS,
        user.registrationExpiresAt?.getTime() ?? Infinity
      )
    );
    await tx.emailVerificationToken.create({
      data: { userId, tokenHash: hashToken(token), expiresAt },
    });
    return enqueueMail(tx, userId, 'verify', {
      token,
      locale: options?.locale,
      name: options?.name,
      registrationExpiresAt: user.registrationExpiresAt?.toISOString(),
    });
  });
  if (id && !options?.queuedOnly) await deliverMailJob(id);
}

export async function verifyEmailWithToken(token: string): Promise<boolean> {
  const tokenHash = hashToken(token);
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return false;
  }

  return prisma.$transaction(async (tx) => {
    await lockUser(tx, record.userId);
    const now = new Date();
    const user = await tx.user.findUnique({ where: { id: record.userId } });
    if (
      !user ||
      user.emailVerifiedAt ||
      (user.registrationExpiresAt && user.registrationExpiresAt <= now)
    )
      return false;
    const claimed = await tx.emailVerificationToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) return false;
    const updated = await tx.user.updateMany({
      where: {
        id: record.userId,
        OR: [{ registrationExpiresAt: null }, { registrationExpiresAt: { gt: now } }],
      },
      data: { emailVerifiedAt: now, registrationExpiresAt: null },
    });
    if (updated.count !== 1) {
      // Roll back the claim if the registration expired while waiting for the lock.
      throw new Error('VERIFICATION_REGISTRATION_EXPIRED');
    }
    await tx.emailVerificationToken.deleteMany({
      where: { userId: record.userId, usedAt: null, id: { not: record.id } },
    });
    return true;
  });
}

export async function resendEmailVerification(
  email: string,
  options?: { locale?: string | null; queuedOnly?: boolean }
): Promise<void> {
  const user = await findUserByEmail(email);

  if (!user || user.emailVerifiedAt || !user.passwordHash) {
    return;
  }

  await createAndSendEmailVerification(user.id, user.email, {
    locale: options?.locale,
    name: user.name,
    queuedOnly: options?.queuedOnly,
  });
}
