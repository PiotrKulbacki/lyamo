import { NextResponse } from 'next/server';
import { env } from '@web/env';
import { getUserFromBearerToken } from '@web/features/auth/services/auth.service';

/** Origin is compared with configured public origin, never caller-controlled Host headers.
 * Cookie-free native JSON requests have no browser Origin/Fetch Metadata.
 * Bearer exemption is opt-in only for handlers that actually authenticate with it.
 */
export async function protectMutation(
  request: Request,
  options: { bearer?: boolean; multipart?: boolean } = {}
): Promise<NextResponse | null> {
  const type = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();
  const hasBody = request.body !== null && request.headers.get('content-length') !== '0';
  if (
    hasBody &&
    type !== 'application/json' &&
    !(options.multipart && type === 'multipart/form-data')
  ) {
    return NextResponse.json({ error: 'auth.errors.generic' }, { status: 415 });
  }

  // Never treat the mere presence of Authorization or x-client-platform as proof.
  // Cookie-bearing requests always need browser protection, including logout.
  if (
    options.bearer &&
    !request.headers.has('cookie') &&
    (await getUserFromBearerToken(request.headers.get('authorization')))
  )
    return null;

  const origin = request.headers.get('origin');
  const site = request.headers.get('sec-fetch-site');
  if (origin === new URL(env.NEXT_PUBLIC_APP_URL).origin && site !== 'cross-site') return null;
  if (!origin && !site && !request.headers.has('cookie') && type === 'application/json')
    return null;
  return NextResponse.json({ error: 'auth.errors.generic' }, { status: 403 });
}
