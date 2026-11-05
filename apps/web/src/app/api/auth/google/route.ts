import { NextResponse } from 'next/server';
import { prisma } from '@lyamo/database';
import * as oidc from 'openid-client';
import { getGoogleOAuthUrl } from '@web/features/auth/lib/google-oidc';
import { hashToken } from '@web/features/auth/lib/tokens';
import { env } from '@web/env';
import { checkAuthRateLimit } from '@web/lib/rate-limit';

export async function GET(request: Request) {
  try {
    const limit = await checkAuthRateLimit(request, 'google');
    if (!limit.allowed)
      return NextResponse.json({ error: 'api.errors.rateLimitExceeded' }, { status: 429 });
    const state = oidc.randomState();
    const nonce = oidc.randomNonce();
    const codeVerifier = oidc.randomPKCECodeVerifier();
    const url = await getGoogleOAuthUrl({ state, nonce, codeVerifier });
    await prisma.$transaction([
      prisma.oAuthAttempt.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
      prisma.oAuthAttempt.create({
        data: {
          stateHash: hashToken(state),
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
