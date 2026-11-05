import { prisma, type Prisma } from '@lyamo/database';
import { cookies } from 'next/headers';
import { enqueueMail } from '@web/features/email/services/mail-outbox.service';
import { AUTH_COOKIE_NAME, SESSION_DURATION_MS, REFRESH_TOKEN_DURATION_MS } from '../types';
import {
  generateToken,
  hashToken,
  signAccessToken,
  verifyAccessClaims,
  nextRefreshToken,
} from '../lib/tokens';

export const IDLE_MS = 7 * 24 * 60 * 60 * 1000;
export const FRESH_MS = 5 * 60 * 1000;
export const REFRESH_RETRY_MS = 30_000;
export const activeSessionWhere = () => ({
  expiresAt: { gt: new Date() },
  lastSeenAt: { gt: new Date(Date.now() - IDLE_MS) },
  user: { emailVerifiedAt: { not: null } },
});

export async function lockUser(tx: Prisma.TransactionClient, userId: string) {
  await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
}

export async function securityEvent(tx: Prisma.TransactionClient, userId: string, kind: string) {
  await tx.securityEvent.deleteMany({
    where: { userId, createdAt: { lt: new Date(Date.now() - 90 * 86400000) } },
  });
  await tx.securityEvent.create({ data: { userId, kind } });
  await enqueueMail(tx, userId, 'security', { event: kind });
}

export async function issueSession(userId: string, mobile: boolean, expectedPasswordHash?: string) {
  return prisma.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.emailVerifiedAt) throw new Error('EMAIL_UNVERIFIED');
    if (expectedPasswordHash && user.passwordHash !== expectedPasswordHash)
      throw new Error('CREDENTIAL_CHANGED');
    const token = generateToken();
    const session = await tx.session.create({
      data: {
        userId,
        token: hashToken(token),
        kind: mobile ? 'mobile' : 'web',
        authenticatedAt: new Date(),
        expiresAt: new Date(
          Date.now() + (mobile ? REFRESH_TOKEN_DURATION_MS : SESSION_DURATION_MS)
        ),
      },
    });
    if (!mobile) return { token };
    const refreshToken = generateToken();
    await tx.refreshToken.create({
      data: {
        userId,
        sessionId: session.id,
        token: hashToken(refreshToken),
        expiresAt: session.expiresAt,
      },
    });
    return { token, accessToken: await signAccessToken(userId, session.id), refreshToken };
  });
}

export async function findSession(request?: Request) {
  const authorization = request?.headers.get('authorization');
  if (authorization) {
    if (!authorization.startsWith('Bearer ')) return null;
    const claims = await verifyAccessClaims(authorization.slice(7));
    if (!claims) return null;
    return prisma.session.findFirst({
      where: { id: claims.sid, userId: claims.sub, kind: 'mobile', ...activeSessionWhere() },
      include: { user: true },
    });
  }
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return prisma.session.findFirst({
    where: { token: hashToken(token), kind: 'web', ...activeSessionWhere() },
    include: { user: true },
  });
}

export async function rotateRefreshToken(raw: string) {
  return prisma.$transaction(async (tx) => {
    const record = await tx.refreshToken.findUnique({ where: { token: hashToken(raw) } });
    if (!record?.sessionId) return null; // Legacy mobile tokens require one new login.
    await lockUser(tx, record.userId);
    // User lock serializes refresh, reset, change and revocation across the family.
    const stored = await tx.refreshToken.findUnique({ where: { id: record.id } });
    const session = await tx.session.findFirst({
      where: { id: record.sessionId, kind: 'mobile', ...activeSessionWhere() },
      include: { user: true },
    });
    if (!stored || !session || stored.expiresAt <= new Date()) return null;
    const successor = nextRefreshToken(raw);
    if (stored.consumedAt) {
      const next = await tx.refreshToken.findUnique({
        where: { token: stored.successorHash ?? '' },
      });
      // Bounded duplicate delivery: same successor, no sliding grace and no new generation.
      if (Date.now() - stored.consumedAt.getTime() <= REFRESH_RETRY_MS && next?.consumedAt)
        return { conflict: true as const };
      if (Date.now() - stored.consumedAt.getTime() > REFRESH_RETRY_MS || !next) {
        await tx.session.deleteMany({ where: { id: session.id } });
        await securityEvent(tx, stored.userId, 'refresh_reuse');
        return null;
      }
    } else {
      await tx.refreshToken.update({
        where: { id: stored.id },
        data: { consumedAt: new Date(), successorHash: hashToken(successor) },
      });
      await tx.refreshToken.create({
        data: {
          userId: stored.userId,
          sessionId: session.id,
          token: hashToken(successor),
          expiresAt: session.expiresAt,
        },
      });
    }
    await tx.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
    return {
      user: session.user,
      accessToken: await signAccessToken(stored.userId, session.id),
      refreshToken: successor,
    };
  });
}

export async function revokeOwnedSessions(userId: string, id?: string) {
  return prisma.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const result = await tx.session.deleteMany({ where: { userId, ...(id ? { id } : {}) } });
    if (!id) await tx.refreshToken.deleteMany({ where: { userId } });
    if (result.count)
      await securityEvent(tx, userId, id ? 'session_revoked' : 'all_sessions_revoked');
    return result.count;
  });
}

export async function isFresh(request: Request) {
  const session = await findSession(request);
  return Boolean(
    session?.authenticatedAt && session.authenticatedAt.getTime() > Date.now() - FRESH_MS
  );
}

// Existing daily cron invokes this; never purges an active family or replay evidence early.
export async function cleanupAuthState(now = new Date()) {
  await prisma.securityEvent.deleteMany({
    where: { createdAt: { lt: new Date(now.getTime() - 90 * 86400000) } },
  });
  await prisma.session.deleteMany({
    where: {
      OR: [{ expiresAt: { lte: now } }, { lastSeenAt: { lte: new Date(now.getTime() - IDLE_MS) } }],
    },
  });
  await prisma.refreshToken.deleteMany({ where: { expiresAt: { lte: now } } });
  await prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lte: now } } });
  await prisma.emailVerificationToken.deleteMany({ where: { expiresAt: { lte: now } } });
}
