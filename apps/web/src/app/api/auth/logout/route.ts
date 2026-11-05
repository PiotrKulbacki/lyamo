import {
  findSession,
  revokeOwnedSessions,
} from '@web/features/auth/services/session-lifecycle.service';
import { protectMutation } from '@web/features/auth/lib/mutation-protection';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@web/features/auth/types';
import {
  clearSessionCookie,
  jsonError,
  revokeRefreshToken,
  revokeSession,
} from '@web/features/auth/services/auth.service';

export async function POST(request: Request) {
  try {
    const rejected = await protectMutation(request, { bodyless: true, bearer: true });
    if (rejected) return rejected;

    const body = (await request.json().catch(() => ({}))) as { refreshToken?: string };
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (request.headers.has('authorization')) {
      const current = await findSession(request);
      if (current) await revokeOwnedSessions(current.userId, current.id);
    }
    if (sessionToken) {
      await revokeSession(sessionToken);
    }

    if (body.refreshToken) {
      await revokeRefreshToken(body.refreshToken);
    }

    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);

    return response;
  } catch {
    return jsonError('auth.errors.generic', 500);
  }
}
