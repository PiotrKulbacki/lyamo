import { prisma } from '@lyamo/database';
import { hashToken } from '@web/features/auth/lib/tokens';
import { readAuthBody, authBodyErrorResponse } from '@web/features/auth/lib/auth-body';
import { protectMutation } from '@web/features/auth/lib/mutation-protection';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AUTH_ERROR_CODES } from '@shared/features/auth/schemas';
import { jsonError } from '@web/features/auth/services/auth.service';
import { verifyEmailWithToken } from '@web/features/auth/services/password-reset.service';
import { checkAuthRateLimit, authRateLimitResponse } from '@web/lib/rate-limit';

const verifyEmailSchema = z.object({
  token: z.string().min(1, AUTH_ERROR_CODES.INVALID_VERIFICATION_TOKEN).max(256),
});

export async function POST(request: Request) {
  try {
    const rejected = await protectMutation(request);
    if (rejected) return rejected;

    const rateLimit = await checkAuthRateLimit(request, 'verify-email');
    if (!rateLimit.allowed) {
      return authRateLimitResponse(rateLimit);
    }

    const body = await readAuthBody(request);
    const parsed = verifyEmailSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError('auth.errors.invalidVerificationToken', 400);
    }

    const token = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash: hashToken(parsed.data.token) },
      select: { userId: true },
    });
    const subjectLimit = await checkAuthRateLimit(
      request,
      'verify-email',
      token?.userId ?? parsed.data.token
    );
    if (!subjectLimit.allowed) return authRateLimitResponse(subjectLimit);

    const ok = await verifyEmailWithToken(parsed.data.token);
    if (!ok) {
      return jsonError('auth.errors.invalidVerificationToken', 400);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return authBodyErrorResponse(error) ?? jsonError('auth.errors.generic', 500);
  }
}
