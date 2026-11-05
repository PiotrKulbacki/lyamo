import { prisma } from '@lyamo/database';
import { hashToken } from '@web/features/auth/lib/tokens';
import { readAuthBody, authBodyErrorResponse } from '@web/features/auth/lib/auth-body';
import { protectMutation } from '@web/features/auth/lib/mutation-protection';
import { NextResponse } from 'next/server';
import { resetPasswordSchema } from '@shared/features/auth/schemas';
import { hashPassword, jsonError } from '@web/features/auth/services/auth.service';
import { resetPasswordWithToken } from '@web/features/auth/services/password-reset.service';
import { checkAuthRateLimit, authRateLimitResponse } from '@web/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const rejected = await protectMutation(request);
    if (rejected) return rejected;

    const rateLimit = await checkAuthRateLimit(request, 'reset-password');
    if (!rateLimit.allowed) {
      return authRateLimitResponse(rateLimit);
    }

    const body = await readAuthBody(request);
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? 'auth.errors.generic';
      return jsonError(firstError, 400);
    }

    const token = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(parsed.data.token) },
      select: { userId: true, usedAt: true, expiresAt: true },
    });
    // Reject random/stale tokens before hashing; the service still claims atomically.
    if (!token || token.usedAt || token.expiresAt <= new Date())
      return jsonError('auth.errors.invalidResetToken', 400);
    const subjectLimit = await checkAuthRateLimit(request, 'reset-password', token.userId);
    if (!subjectLimit.allowed) return authRateLimitResponse(subjectLimit);

    const passwordHash = await hashPassword(parsed.data.password);
    const ok = await resetPasswordWithToken(parsed.data.token, passwordHash);

    if (!ok) {
      return jsonError('auth.errors.invalidResetToken', 400);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return authBodyErrorResponse(error) ?? jsonError('auth.errors.generic', 500);
  }
}
