import {
  findSession,
  activeSessionWhere,
  lockUser,
  securityEvent,
} from '@web/features/auth/services/session-lifecycle.service';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@lyamo/database';
import { env } from '@web/env';
import { exchangeGoogleCode, googleCallbackUrl } from '@web/features/auth/lib/google-oidc';
import { hashToken } from '@web/features/auth/lib/tokens';
import { setSessionCookie } from '@web/features/auth/services/auth.service';
import {
  createGoogleSession,
  GoogleAccountConflict,
} from '@web/features/auth/services/google-auth.service';

export async function GET(request: Request) {
  let response: NextResponse;
  try {
    const input = new URL(request.url);
    const state = input.searchParams.get('state');
    const storedState = (await cookies()).get('sec_oauth_state')?.value;
    if (!state || state !== storedState || input.searchParams.getAll('state').length !== 1) {
      throw new Error('INVALID_STATE');
    }
    // DELETE RETURNING is the atomic claim: concurrent or replayed callbacks
    // cannot both exchange a code, including errors and denied consent.
    const claimed = await prisma.$queryRaw<
      Array<{
        nonce: string;
        codeVerifier: string;
        purpose: string;
        userId: string | null;
        sessionId: string | null;
      }>
    >`
      DELETE FROM oauth_attempts
      WHERE "stateHash" = ${hashToken(state)} AND "expiresAt" > CURRENT_TIMESTAMP
      RETURNING nonce, "codeVerifier", purpose, "userId", "sessionId"
    `;
    if (claimed.length !== 1) throw new Error('USED_STATE');
    const callback = new URL(googleCallbackUrl());
    callback.search = input.search;
    const profile = await exchangeGoogleCode(callback, { state, ...claimed[0]! });
    if (claimed[0]!.purpose === 'link') {
      const attempt = claimed[0]!;
      const current = await findSession(request);
      if (!current || current.id !== attempt.sessionId || current.userId !== attempt.userId)
        throw new Error('LINK_SESSION_MISMATCH');
      await prisma.$transaction(async (tx) => {
        await lockUser(tx, current.userId);
        const fresh = await tx.session.findFirst({
          where: {
            id: current.id,
            authenticatedAt: { gt: new Date(Date.now() - 300000) },
            ...activeSessionWhere(),
          },
        });
        if (!fresh) throw new Error('REAUTH_REQUIRED');
        const existing = await tx.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: 'google',
              providerAccountId: profile.providerAccountId,
            },
          },
        });
        if (existing && existing.userId !== current.userId) throw new GoogleAccountConflict();
        if (!existing) {
          // One Google method per user; no email matching or transfer of another user's account.
          if (await tx.account.findFirst({ where: { userId: current.userId, provider: 'google' } }))
            throw new GoogleAccountConflict();
          await tx.account.create({
            data: {
              userId: current.userId,
              provider: 'google',
              providerAccountId: profile.providerAccountId,
            },
          });
          await securityEvent(tx, current.userId, 'method_linked');
        }
      });
      response = NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/settings`);
    } else if (claimed[0]!.purpose === 'reauth') {
      const attempt = claimed[0]!;
      const current = await findSession(request);
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: 'google',
            providerAccountId: profile.providerAccountId,
          },
        },
      });
      if (
        !current ||
        current.id !== attempt.sessionId ||
        current.userId !== attempt.userId ||
        account?.userId !== current.userId ||
        !profile.authenticatedAt ||
        profile.authenticatedAt < Date.now() / 1000 - 300 ||
        profile.authenticatedAt > Date.now() / 1000 + 60
      )
        throw new Error('REAUTH_FAILED');
      await prisma.$transaction(async (tx) => {
        await lockUser(tx, current.userId);
        const updated = await tx.session.updateMany({
          where: { id: current.id, ...activeSessionWhere() },
          data: { authenticatedAt: new Date(profile.authenticatedAt! * 1000) },
        });
        if (updated.count !== 1) throw new Error('REVOKED');
        await securityEvent(tx, current.userId, 'reauthenticated');
      });
      response = NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/settings?reauth=success`);
    } else {
      const token = await createGoogleSession(profile);
      response = NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/dashboard`);
      setSessionCookie(response, token);
    }
  } catch (error) {
    const key = error instanceof GoogleAccountConflict ? 'oauthAccountExists' : 'oauthFailed';
    response = NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/login?error=auth.errors.${key}`);
  }
  response.cookies.set('sec_oauth_state', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
