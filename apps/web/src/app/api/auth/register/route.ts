import { performance } from 'node:perf_hooks';
import { finishNeutralResponse } from '@web/features/auth/lib/neutral-response';
import { readAuthBody, authBodyErrorResponse } from '@web/features/auth/lib/auth-body';
import { findUserByEmail } from '@web/features/auth/services/email-identity.service';
import { protectMutation } from '@web/features/auth/lib/mutation-protection';
import { NextResponse } from 'next/server';
import { registerSchema } from '@shared/features/auth/schemas';
import { getFinancialMonthStartDayFromDate } from '@shared/features/billing/financial-month';
import { prisma, Prisma } from '@lyamo/database';
import { captureServerException } from '@web/lib/sentry-server';
import { hashPassword, jsonError } from '@web/features/auth/services/auth.service';
import { createAndSendEmailVerification } from '@web/features/auth/services/password-reset.service';
import { checkAuthRateLimit, authRateLimitResponse } from '@web/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const rejected = await protectMutation(request);
    if (rejected) return rejected;

    const rateLimit = await checkAuthRateLimit(request, 'register');
    if (!rateLimit.allowed) {
      return authRateLimitResponse(rateLimit);
    }

    const body = await readAuthBody(request);

    if (!body.acceptedLegal) {
      return jsonError('auth.errors.legalAcceptanceRequired', 400);
    }

    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? 'auth.errors.generic';
      return jsonError(firstError, 400);
    }

    const started = performance.now();
    const subjectLimit = await checkAuthRateLimit(request, 'register', parsed.data.email);
    if (!subjectLimit.allowed) return authRateLimitResponse(subjectLimit);

    const { email, password, name, locale } = parsed.data;

    const existingUser = await findUserByEmail(email);
    // Always pay the same password hash cost, including existing and OAuth-only accounts.
    const passwordHash = await hashPassword(password);
    const now = new Date();

    if (!existingUser) {
      try {
        const user = await prisma.user.create({
          data: {
            email,
            passwordHash,
            name: name ?? null,
            financialMonthStartDay: getFinancialMonthStartDayFromDate(now),
            lastQuotaResetAt: now,
            emailVerifiedAt: null,
            registrationExpiresAt: new Date(now.getTime() + 72 * 60 * 60 * 1000),
          },
        });

        await createAndSendEmailVerification(user.id, user.email, {
          locale,
          name: user.name,
          queuedOnly: true,
        });
      } catch (error) {
        // Concurrent registration must not expose the unique constraint race.
        if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) {
          // Public acknowledgement remains neutral; operational errors go to existing monitoring.
          captureServerException(new Error('AUTH_REGISTRATION_DELIVERY_FAILED'), {
            scope: 'register',
          });
        }
      }
    }
    await finishNeutralResponse(started);
    // Hard gate (D1): no session / tokens until email is verified.
    return NextResponse.json(
      {
        requiresEmailVerification: true,
        registrationExpiresAt: new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString(),
        email,
      },
      { status: 201 }
    );
  } catch (error) {
    return authBodyErrorResponse(error) ?? jsonError('auth.errors.generic', 500);
  }
}
