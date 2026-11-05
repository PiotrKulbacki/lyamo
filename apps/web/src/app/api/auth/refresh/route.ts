import { protectMutation } from '@web/features/auth/lib/mutation-protection';
import { NextResponse } from 'next/server';
import { rotateRefreshToken } from '@web/features/auth/services/session-lifecycle.service';
import { jsonError, toSafeUser } from '@web/features/auth/services/auth.service';
export async function POST(request: Request) {
  try {
    const rejected = await protectMutation(request);
    if (rejected) return rejected;
    const body = await request.json();
    if (typeof body.refreshToken !== 'string' || body.refreshToken.length > 256)
      return jsonError('auth.errors.unauthorized', 401);
    const result = await rotateRefreshToken(body.refreshToken);
    if (!result) return jsonError('auth.errors.sessionExpired', 401);
    if ('conflict' in result) return jsonError('auth.errors.refreshConflict', 409);
    const response = NextResponse.json({ ...result, user: toSafeUser(result.user) });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch {
    return jsonError('auth.errors.generic', 500);
  }
}
