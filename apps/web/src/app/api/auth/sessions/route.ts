import { prisma } from '@lyamo/database';
import { NextResponse } from 'next/server';
import { protectMutation } from '@web/features/auth/lib/mutation-protection';
import {
  findSession,
  activeSessionWhere,
  revokeOwnedSessions,
} from '@web/features/auth/services/session-lifecycle.service';
import { jsonError } from '@web/features/auth/services/auth.service';
export async function GET(request: Request) {
  const current = await findSession(request);
  if (!current) return jsonError('auth.errors.unauthorized', 401);
  const sessions = await prisma.session.findMany({
    where: { userId: current.userId, ...activeSessionWhere() },
    select: { id: true, kind: true, createdAt: true, lastSeenAt: true, expiresAt: true },
    orderBy: { createdAt: 'desc' },
  });
  const events = await prisma.securityEvent.findMany({
    where: { userId: current.userId, createdAt: { gt: new Date(Date.now() - 90 * 86400000) } },
    select: { id: true, kind: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  const googleLinked = Boolean(
    await prisma.account.findFirst({ where: { userId: current.userId, provider: 'google' } })
  );
  return NextResponse.json(
    {
      sessions: sessions.map((s) => ({ ...s, current: s.id === current.id })),
      events,
      googleLinked,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
export async function DELETE(request: Request) {
  try {
    const rejected = await protectMutation(request, { bearer: true });
    if (rejected) return rejected;
    const current = await findSession(request);
    if (!current) return jsonError('auth.errors.unauthorized', 401);
    const body = await request.json();
    if (body.all !== true && (typeof body.id !== 'string' || !body.id))
      return jsonError('auth.errors.generic', 400);
    const count = await revokeOwnedSessions(
      current.userId,
      body.all === true ? undefined : body.id
    );
    return count ? NextResponse.json({ ok: true }) : jsonError('auth.errors.unauthorized', 404);
  } catch {
    return jsonError('auth.errors.generic', 500);
  }
}
