import { cleanupAuthState } from '@web/features/auth/services/session-lifecycle.service';
import { NextResponse } from 'next/server';
import { env } from '@web/env';
import { deleteExpiredRegistrations } from '@web/features/auth/services/registration-cleanup.service';
import { captureServerException } from '@web/lib/sentry-server';
import { processMailOutbox } from '@web/features/email/services/mail-outbox.service';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  if (!env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Never delete production data from a preview invocation.
  if (process.env.VERCEL_ENV === 'preview') {
    return NextResponse.json({ error: 'Not available in Preview' }, { status: 403 });
  }
  try {
    await cleanupAuthState();
    await processMailOutbox();
    const deleted = await deleteExpiredRegistrations();
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    captureServerException(error, { scope: 'cron.delete-unverified-accounts' });
    return NextResponse.json({ error: 'Registration cleanup failed' }, { status: 500 });
  }
}
