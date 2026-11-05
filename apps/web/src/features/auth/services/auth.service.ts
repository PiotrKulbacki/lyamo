import { issueSession, findSession, revokeOwnedSessions } from './session-lifecycle.service';
import { prisma } from '@lyamo/database';
import bcrypt from 'bcryptjs';
import { cache } from 'react';
import { NextResponse } from 'next/server';
import {
  AUTH_COOKIE_NAME,
  SESSION_DURATION_MS,
  type AuthResponse,
  type SafeUser,
  toSafeUser,
} from '@web/features/auth/types';
import { hashToken } from '@web/features/auth/lib/tokens';
import { touchUserLastActive } from '@web/features/auth/services/last-active.service';

export { toSafeUser };

const BCRYPT_ROUNDS = 12;
// Valid cost-12 bcrypt salt/hash, no user's credential. No lazy first-request hash.
export const DUMMY_PASSWORD_HASH = '$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createWebSession(
  userId: string,
  expectedPasswordHash?: string
): Promise<string> {
  return (await issueSession(userId, false, expectedPasswordHash)).token;
}

export async function createMobileTokens(
  userId: string,
  expectedPasswordHash?: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const result = await issueSession(userId, true, expectedPasswordHash);
  return { accessToken: result.accessToken!, refreshToken: result.refreshToken! };
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    ...sessionCookieOptions(),
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(AUTH_COOKIE_NAME, '', { ...sessionCookieOptions(), maxAge: 0 });
}

export function buildAuthResponse(
  user: SafeUser,
  tokens?: { accessToken: string; refreshToken: string }
): AuthResponse {
  return tokens ? { user, ...tokens } : { user };
}

async function resolveUserFromSession(): Promise<SafeUser | null> {
  const session = await findSession();
  if (!session) return null;
  await prisma.session.updateMany({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
  touchUserLastActive(session.user.id, session.user.lastActiveAt);
  return toSafeUser(session.user);
}

export const getUserFromSession = cache(resolveUserFromSession);

export async function getUserFromBearerToken(
  authorizationHeader: string | null
): Promise<SafeUser | null> {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null;
  }

  const session = await findSession(
    new Request('http://localhost', { headers: { authorization: authorizationHeader } })
  );
  if (!session) return null;
  const user = session.user;
  await prisma.session.updateMany({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
  touchUserLastActive(user.id, user.lastActiveAt);
  return toSafeUser(user);
}

export async function revokeSession(token: string): Promise<void> {
  const session = await prisma.session.findUnique({ where: { token: hashToken(token) } });
  if (session) await revokeOwnedSessions(session.userId, session.id);
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const stored = await prisma.refreshToken.findUnique({ where: { token: hashToken(token) } });
  if (stored?.sessionId) await revokeOwnedSessions(stored.userId, stored.sessionId);
  else await prisma.refreshToken.deleteMany({ where: { token: hashToken(token) } });
}

export function isMobileClient(request: Request): boolean {
  return request.headers.get('x-client-platform') === 'mobile';
}

export function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status });
}
