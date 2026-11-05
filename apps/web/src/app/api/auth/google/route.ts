import { findSession, FRESH_MS } from '@web/features/auth/services/session-lifecycle.service';
import { NextResponse } from 'next/server';
import { prisma } from '@lyamo/database';
import * as oidc from 'openid-client';
import { getGoogleOAuthUrl } from '@web/features/auth/lib/google-oidc';
import { hashToken } from '@web/features/auth/lib/tokens';
import { env } from '@web/env';
import { checkAuthRateLimit, authRateLimitResponse } from '@web/lib/rate-limit';

export async function GET(request: Request) {
  try {
    const limit = await checkAuthRateLimit(request, 'google');
    if (!limit.allowed) return authRateLimitResponse(limit);
    const requestedPurpose = new URL(request.url).searchParams.get('purpose');
    const purpose =
      requestedPurpose === 'reauth' || requestedPurpose === 'link' ? requestedPurpose : 'login';
    const session = purpose !== 'login' ? await findSession(request) : null;
    if (purpose !== 'login' && !session) throw new Error('NO_SESSION');
    if (
      purpose === 'link' &&
      (!session?.authenticatedAt || session.authenticatedAt.getTime() <= Date.now() - FRESH_MS)
    )
      throw new Error('REAUTH_REQUIRED');
    const state = oidc.randomState();
    const nonce = oidc.randomNonce();
    const codeVerifier = oidc.randomPKCECodeVerifier();
    const url = await getGoogleOAuthUrl(
      { state, nonce, codeVerifier },
      undefined,
      purpose === 'reauth'
    );
    await prisma.$transaction([
      prisma.oAuthAttempt.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
      prisma.oAuthAttempt.create({
        data: {
          stateHash: hashToken(state),
          purpose,
          userId: session?.userId,
          sessionId: session?.id,
          nonce,
          codeVerifier,
          expiresAt: new Date(Date.now() + 600_000),
        },
      }),
    ]);
    const response = NextResponse.redirect(url);
    response.headers.set('Cache-Control', 'no-store');
    response.cookies.set('sec_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 600,
    });
    return response;
  } catch {
    return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/login?error=auth.errors.oauthFailed`);
  }
}
