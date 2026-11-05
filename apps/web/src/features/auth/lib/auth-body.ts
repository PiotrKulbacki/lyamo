import { NextResponse } from 'next/server';

const MAX_AUTH_BODY_BYTES = 16 * 1024;
export class AuthBodyError extends Error {
  constructor(public status: number) {
    super('AUTH_BODY_REJECTED');
  }
}
/** Bound actual streamed bytes, including chunked requests and false Content-Length. */
export async function readAuthBody(request: Request): Promise<Record<string, unknown>> {
  if (Number(request.headers.get('content-length')) > MAX_AUTH_BODY_BYTES)
    throw new AuthBodyError(413);
  const reader = request.body?.getReader();
  if (!reader) throw new AuthBodyError(400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_AUTH_BODY_BYTES) {
        await reader.cancel();
        throw new AuthBodyError(413);
      }
      chunks.push(value);
    }
    const body: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new AuthBodyError(400);
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof AuthBodyError) throw error;
    throw new AuthBodyError(400);
  } finally {
    reader.releaseLock();
  }
}
export function authBodyErrorResponse(error: unknown): NextResponse | null {
  return error instanceof AuthBodyError
    ? NextResponse.json({ error: 'auth.errors.generic' }, { status: error.status })
    : null;
}
