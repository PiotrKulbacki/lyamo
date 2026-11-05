import { createHash, randomBytes } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { env } from '@web/env';

let secretKey: Uint8Array | undefined;

function getSecretKey(): Uint8Array {
  secretKey ??= new TextEncoder().encode(env.AUTH_SECRET);
  return secretKey;
}

export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getSecretKey());
}

export async function verifyAccessToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.type !== 'access' || typeof payload.sub !== 'string') {
      return null;
    }
    return payload.sub;
  } catch {
    return null;
  }
}
