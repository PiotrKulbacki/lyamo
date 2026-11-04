import { protectMutation } from '@web/features/auth/lib/mutation-protection';
import { NextResponse } from 'next/server';
import { updateUserSchema } from '@shared/features/user/schemas';
import { getAuthenticatedUser } from '@web/features/auth/lib/request-auth';
import {
  getUserFromBearerToken,
  getUserFromSession,
  clearSessionCookie,
  jsonError,
} from '@web/features/auth/services/auth.service';
import { deleteUserAccount, updateUser } from '@web/features/user/services/user.service';

export async function GET(request: Request) {
  try {
    const sessionUser = await getUserFromSession();
    if (sessionUser) {
      return NextResponse.json({ user: sessionUser });
    }

    const bearerUser = await getUserFromBearerToken(request.headers.get('authorization'));
    if (bearerUser) {
      return NextResponse.json({ user: bearerUser });
    }

    const response = jsonError('auth.errors.unauthorized', 401);
    clearSessionCookie(response);
    return response;
  } catch {
    return jsonError('auth.errors.generic', 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const rejected = await protectMutation(request, { bearer: true });
    if (rejected) return rejected;

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return jsonError('auth.errors.unauthorized', 401);
    }

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? 'settings.errors.updateFailed';
      return jsonError(firstError, 400);
    }

    const updatedUser = await updateUser(user.id, parsed.data);
    return NextResponse.json({ user: updatedUser, message: 'settings.success.updated' });
  } catch {
    return jsonError('settings.errors.updateFailed', 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const rejected = await protectMutation(request, { bearer: true });
    if (rejected) return rejected;

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return jsonError('auth.errors.unauthorized', 401);
    }

    await deleteUserAccount(user.id);

    const response = NextResponse.json({ message: 'settings.success.accountDeleted' });
    clearSessionCookie(response);

    return response;
  } catch {
    return jsonError('settings.errors.deleteFailed', 500);
  }
}
