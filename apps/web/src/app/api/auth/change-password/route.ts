import {
  findSession,
  lockUser,
  securityEvent,
} from '@web/features/auth/services/session-lifecycle.service';
import {
  createMobileTokens,
  createWebSession,
  isMobileClient,
  setSessionCookie,
} from '@web/features/auth/services/auth.service';
import { protectMutation } from '@web/features/auth/lib/mutation-protection';
import { NextResponse } from 'next/server';
import { changePasswordSchema } from '@shared/features/auth/schemas';
import { prisma } from '@lyamo/database';
import { getAuthenticatedUser } from '@web/features/auth/lib/request-auth';
import { hashPassword, jsonError, verifyPassword } from '@web/features/auth/services/auth.service';
import { checkAuthRateLimit } from '@web/lib/rate-limit';

const RATE_LIMIT_ERROR = 'api.errors.rateLimitExceeded';

export async function POST(request: Request) {
  try {
    const rejected = await protectMutation(request, { bearer: true });
    if (rejected) return rejected;

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return jsonError('auth.errors.unauthorized', 401);
    }

    const rateLimit = await checkAuthRateLimit(request, 'change-password', user.id);
    if (!rateLimit.allowed) {
      return jsonError(RATE_LIMIT_ERROR, 429);
    }

    if (!user.hasPassword) {
      return jsonError('auth.errors.oauthPasswordChangeUnavailable', 400);
    }

    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? 'auth.errors.generic';
      return jsonError(firstError, 400);
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.passwordHash) {
      return jsonError('auth.errors.oauthPasswordChangeUnavailable', 400);
    }

    const isValid = await verifyPassword(parsed.data.currentPassword, dbUser.passwordHash);
    if (!isValid) {
      return jsonError('auth.errors.currentPasswordIncorrect', 400);
    }

    const passwordHash = await hashPassword(parsed.data.newPassword);
    const current = await findSession(request);
    if (!current) return jsonError('auth.errors.unauthorized', 401);
    const changed = await prisma.$transaction(async (tx) => {
      await lockUser(tx, user.id);
      const active = await tx.session.findUnique({ where: { id: current.id } });
      const latest = await tx.user.findUnique({ where: { id: user.id } });
      if (!active || latest?.passwordHash !== dbUser.passwordHash) return false;
      await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
      await tx.session.deleteMany({ where: { userId: user.id } });
      await tx.refreshToken.deleteMany({ where: { userId: user.id } });
      await tx.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
      await securityEvent(tx, user.id, 'password_changed');
      return true;
    });
    if (!changed) return jsonError('auth.errors.unauthorized', 401);
    if (isMobileClient(request))
      return NextResponse.json({ ok: true, ...(await createMobileTokens(user.id, passwordHash)) });
    const token = await createWebSession(user.id, passwordHash);
    const response = NextResponse.json({ ok: true });
    setSessionCookie(response, token);
    return response;
  } catch {
    return jsonError('auth.errors.generic', 500);
  }
}
