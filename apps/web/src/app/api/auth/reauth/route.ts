import { prisma } from '@lyamo/database';
import { NextResponse } from 'next/server';
import { protectMutation } from '@web/features/auth/lib/mutation-protection';
import {
  findSession,
  activeSessionWhere,
  lockUser,
  securityEvent,
} from '@web/features/auth/services/session-lifecycle.service';
import { jsonError, verifyPassword } from '@web/features/auth/services/auth.service';
import { checkAuthRateLimit } from '@web/lib/rate-limit';
export async function POST(request: Request) {
  try {
    const rejected = await protectMutation(request, { bearer: true });
    if (rejected) return rejected;
    const session = await findSession(request);
    if (!session) return jsonError('auth.errors.unauthorized', 401);
    if (!(await checkAuthRateLimit(request, 'reauth', session.userId)).allowed)
      return jsonError('api.errors.rateLimitExceeded', 429);
    const body = await request.json();
    if (
      !session.user.passwordHash ||
      typeof body.password !== 'string' ||
      body.password.length > 1024 ||
      !(await verifyPassword(body.password, session.user.passwordHash))
    )
      return jsonError('auth.errors.invalidCredentials', 401);
    const ok = await prisma.$transaction(async (tx) => {
      await lockUser(tx, session.userId);
      const user = await tx.user.findUnique({ where: { id: session.userId } });
      if (user?.passwordHash !== session.user.passwordHash) return false;
      const updated = await tx.session.updateMany({
        where: { id: session.id, ...activeSessionWhere() },
        data: { authenticatedAt: new Date() },
      });
      if (updated.count !== 1) return false;
      await securityEvent(tx, session.userId, 'reauthenticated');
      return true;
    });
    return ok ? NextResponse.json({ ok: true }) : jsonError('auth.errors.unauthorized', 401);
  } catch {
    return jsonError('auth.errors.generic', 500);
  }
}
