import { performance } from 'node:perf_hooks';
import { finishNeutralResponse } from '@web/features/auth/lib/neutral-response';
import { readAuthBody, authBodyErrorResponse } from '@web/features/auth/lib/auth-body';
import { protectMutation } from '@web/features/auth/lib/mutation-protection';
import { NextResponse } from 'next/server';
import { forgotPasswordSchema } from '@shared/features/auth/schemas';
import { jsonError } from '@web/features/auth/services/auth.service';
import { createAndSendPasswordReset } from '@web/features/auth/services/password-reset.service';
import { checkAuthRateLimit, authRateLimitResponse } from '@web/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const rejected = await protectMutation(request);
    if (rejected) return rejected;

    const rateLimit = await checkAuthRateLimit(request, 'forgot-password');
    if (!rateLimit.allowed) {
      return authRateLimitResponse(rateLimit);
    }

    const body = await readAuthBody(request);
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? 'auth.errors.generic';
      return jsonError(firstError, 400);
    }

    const started = performance.now();
    const subjectLimit = await checkAuthRateLimit(request, 'forgot-password', parsed.data.email);
    if (!subjectLimit.allowed) return authRateLimitResponse(subjectLimit);

    await createAndSendPasswordReset(parsed.data.email, {
      locale: parsed.data.locale,
      queuedOnly: true,
    }).catch(() => {});

    await finishNeutralResponse(started);
    // Always succeed to avoid email enumeration.
    return NextResponse.json({ ok: true });
  } catch (error) {
    return authBodyErrorResponse(error) ?? jsonError('auth.errors.generic', 500);
  }
}
