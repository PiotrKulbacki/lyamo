import { findUserByEmail } from '@web/features/auth/services/email-identity.service';
import { protectMutation } from '@web/features/auth/lib/mutation-protection';
import { NextResponse } from 'next/server';
import { loginSchema } from '@shared/features/auth/schemas';
import {
  buildAuthResponse,
  createMobileTokens,
  createWebSession,
  isMobileClient,
  jsonError,
  setSessionCookie,
  toSafeUser,
  verifyPassword,
} from '@web/features/auth/services/auth.service';
import { checkAuthRateLimit } from '@web/lib/rate-limit';

const RATE_LIMIT_ERROR = 'api.errors.rateLimitExceeded';

export async function POST(request: Request) {
  try {
    const rejected = await protectMutation(request);
    if (rejected) return rejected;

    const rateLimit = await checkAuthRateLimit(request, 'login');
    if (!rateLimit.allowed) {
      return jsonError(RATE_LIMIT_ERROR, 429);
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? 'auth.errors.generic';
      return jsonError(firstError, 400);
    }

    const { email, password } = parsed.data;

    const user = await findUserByEmail(email);

    if (!user?.passwordHash) {
      return jsonError('auth.errors.invalidCredentials', 401);
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return jsonError('auth.errors.invalidCredentials', 401);
    }

    if (!user.emailVerifiedAt) {
      return NextResponse.json(
        {
          error: 'auth.errors.emailNotVerified',
          email: user.email,
          registrationExpiresAt: user.registrationExpiresAt?.toISOString(),
        },
        { status: 403 }
      );
    }

    const safeUser = toSafeUser(user);
    const mobile = isMobileClient(request);

    if (mobile) {
      const tokens = await createMobileTokens(user.id, user.passwordHash);
      return NextResponse.json(buildAuthResponse(safeUser, tokens));
    }

    const sessionToken = await createWebSession(user.id, user.passwordHash);
    const response = NextResponse.json(buildAuthResponse(safeUser));
    setSessionCookie(response, sessionToken);
    return response;
  } catch {
    return jsonError('auth.errors.generic', 500);
  }
}
