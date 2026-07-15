import { NextResponse } from 'next/server';
import { confirmProUpgradeCycleDaySchema } from '@shared/features/billing/pro-upgrade-cycle-day';
import { getAuthenticatedUser } from '@web/features/auth/lib/request-auth';
import { jsonError } from '@web/features/auth/services/auth.service';
import { confirmProUpgradeCycleDay } from '@web/features/billing/services/pro-upgrade-cycle-day.service';

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return jsonError('auth.errors.unauthorized', 401);
    }

    const body = await request.json();
    const parsed = confirmProUpgradeCycleDaySchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? 'auth.errors.generic';
      return jsonError(firstError, 400);
    }

    const result = await confirmProUpgradeCycleDay(user.id, parsed.data);

    if ('error' in result) {
      return jsonError(result.error, 400);
    }

    return NextResponse.json(result);
  } catch {
    return jsonError('auth.errors.generic', 500);
  }
}
