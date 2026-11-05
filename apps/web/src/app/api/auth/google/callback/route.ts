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
    const claimed = await prisma.$queryRaw<Array<{ nonce: string; codeVerifier: string }>>`
      DELETE FROM oauth_attempts
      WHERE "stateHash" = ${hashToken(state)} AND "expiresAt" > CURRENT_TIMESTAMP
      RETURNING nonce, "codeVerifier"
    `;
    if (claimed.length !== 1) throw new Error('USED_STATE');
    const callback = new URL(googleCallbackUrl());
    callback.search = input.search;
    const profile = await exchangeGoogleCode(callback, { state, ...claimed[0]! });
    const token = await createGoogleSession(profile);
    response = NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/dashboard`);
    setSessionCookie(response, token);
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
