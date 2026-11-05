import { readAuthBody, authBodyErrorResponse } from '@web/features/auth/lib/auth-body';
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
  DUMMY_PASSWORD_HASH,
} from '@web/features/auth/services/auth.service';
import { checkAuthRateLimit, authRateLimitResponse } from '@web/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const rejected = await protectMutation(request);
    if (rejected) return rejected;

    const rateLimit = await checkAuthRateLimit(request, 'login');
    if (!rateLimit.allowed) {
      return authRateLimitResponse(rateLimit);
    }

    const body = await readAuthBody(request);
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? 'auth.errors.generic';
      return jsonError(firstError, 400);
    }

    const subjectLimit = await checkAuthRateLimit(request, 'login', parsed.data.email);
    if (!subjectLimit.allowed) return authRateLimitResponse(subjectLimit);

    const { email, password } = parsed.data;

    const user = await findUserByEmail(email);

    const isValid = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!user?.passwordHash || !isValid) {
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
  } catch (error) {
    return authBodyErrorResponse(error) ?? jsonError('auth.errors.generic', 500);
  }
}
