import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@web/features/auth/lib/request-auth';
import { jsonError } from '@web/features/auth/services/auth.service';
import { deleteReceiptImage } from '@web/features/scanner/services/receipt-storage.service';

const discardReceiptSchema = z.object({
  receiptGroupId: z.string().uuid(),
  receiptImageUrl: z.string().min(1).max(2048),
});

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return jsonError('auth.errors.unauthorized', 401);
    }

    const body = await request.json();
    const parsed = discardReceiptSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError('auth.errors.generic', 400);
    }

    const { receiptImageUrl } = parsed.data;
    if (!receiptImageUrl.startsWith(`${user.id}/`)) {
      return jsonError('auth.errors.forbidden', 403);
    }

    await deleteReceiptImage(receiptImageUrl);
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError('auth.errors.generic', 500);
  }
}
