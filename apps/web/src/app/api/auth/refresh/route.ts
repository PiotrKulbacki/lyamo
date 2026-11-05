import { prisma } from '@lyamo/database';
import { hashToken } from '@web/features/auth/lib/tokens';
import { checkAuthRateLimit, authRateLimitResponse } from '@web/lib/rate-limit';
import { readAuthBody, authBodyErrorResponse } from '@web/features/auth/lib/auth-body';
import { protectMutation } from '@web/features/auth/lib/mutation-protection';
import { NextResponse } from 'next/server';
import { rotateRefreshToken } from '@web/features/auth/services/session-lifecycle.service';
import { jsonError, toSafeUser } from '@web/features/auth/services/auth.service';
export async function POST(request: Request) {
  try {
    const rejected = await protectMutation(request);
    if (rejected) return rejected;
    const ipLimit = await checkAuthRateLimit(request, 'refresh');
    if (!ipLimit.allowed) return authRateLimitResponse(ipLimit);
    const body = await readAuthBody(request);
    if (typeof body.refreshToken !== 'string' || body.refreshToken.length > 256)
      return jsonError('auth.errors.unauthorized', 401);
    const stored = await prisma.refreshToken.findUnique({
      where: { token: hashToken(body.refreshToken) },
      select: { userId: true },
    });
    const tokenLimit = await checkAuthRateLimit(
      request,
      'refresh',
      stored?.userId ?? body.refreshToken
    );
    if (!tokenLimit.allowed) return authRateLimitResponse(tokenLimit);
    const result = await rotateRefreshToken(body.refreshToken);
    if (!result) return jsonError('auth.errors.sessionExpired', 401);
    if ('conflict' in result) return jsonError('auth.errors.refreshConflict', 409);
    const response = NextResponse.json({ ...result, user: toSafeUser(result.user) });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    return authBodyErrorResponse(error) ?? jsonError('auth.errors.generic', 500);
  }
}
