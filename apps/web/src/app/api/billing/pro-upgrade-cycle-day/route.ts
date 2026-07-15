import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@web/features/auth/lib/request-auth';
import { jsonError } from '@web/features/auth/services/auth.service';
import { getProUpgradeCycleDayStatus } from '@web/features/billing/services/pro-upgrade-cycle-day.service';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return jsonError('auth.errors.unauthorized', 401);
    }

    const status = await getProUpgradeCycleDayStatus(user.id);
    return NextResponse.json(status);
  } catch {
    return jsonError('auth.errors.generic', 500);
  }
}
