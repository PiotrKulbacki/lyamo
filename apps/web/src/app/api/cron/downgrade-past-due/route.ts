import { prisma } from '@smart-expense-control/database';
import { PAST_DUE_GRACE_MS } from '@shared/features/billing/financial-month';
import { env } from '@web/env';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function isAuthorizedCronRequest(request: Request): boolean {
  if (!env.CRON_SECRET) {
    return false;
  }

  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${env.CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const graceCutoff = new Date(Date.now() - PAST_DUE_GRACE_MS);

    const result = await prisma.user.updateMany({
      where: {
        currentPlan: 'PRO',
        pastDueSince: {
          not: null,
          lte: graceCutoff,
        },
      },
      data: {
        currentPlan: 'FREE',
        pastDueSince: null,
      },
    });

    return NextResponse.json({
      success: true,
      usersDowngraded: result.count,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'Past due downgrade failed' }, { status: 500 });
  }
}
