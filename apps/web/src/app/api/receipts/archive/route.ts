import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@web/features/auth/lib/request-auth';
import { jsonError } from '@web/features/auth/services/auth.service';
import { listReceiptArchiveDocuments } from '@web/features/scanner/services/receipt-archive.service';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return jsonError('auth.errors.unauthorized', 401);
    }

    const documents = await listReceiptArchiveDocuments(user.id);
    return NextResponse.json({ documents });
  } catch {
    return jsonError('scanner.archive.errors.loadFailed', 500);
  }
}
