import { NextResponse } from 'next/server';
import { env } from '@web/env';
import { clearSessionCookie, getUserFromSession } from '@web/features/auth/services/auth.service';

export async function GET() {
  const user = await getUserFromSession();
  const response = NextResponse.redirect(
    new URL(user ? '/dashboard' : '/login', env.NEXT_PUBLIC_APP_URL)
  );
  response.headers.set('Cache-Control', 'no-store');
  if (!user) clearSessionCookie(response);
  return response;
}
