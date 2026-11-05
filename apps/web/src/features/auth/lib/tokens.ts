import { createHash, createHmac, randomBytes } from 'node:crypto';
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

export function nextRefreshToken(token: string): string {
  return createHmac('sha256', getSecretKey())
    .update('lyamo-refresh-v1:' + token)
    .digest('hex');
}

export async function signAccessToken(userId: string, sessionId?: string): Promise<string> {
  return new SignJWT({ sub: userId, sid: sessionId, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('lyamo')
    .setAudience('lyamo-mobile')
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getSecretKey());
}

export async function verifyAccessClaims(
  token: string
): Promise<{ sub: string; sid: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ['HS256'],
      issuer: 'lyamo',
      audience: 'lyamo-mobile',
      requiredClaims: ['sub', 'sid', 'iat', 'exp'],
    });
    if (
      payload.type !== 'access' ||
      typeof payload.sub !== 'string' ||
      typeof payload.sid !== 'string'
    )
      return null;
    return { sub: payload.sub, sid: payload.sid };
  } catch {
    return null;
  }
}

export async function verifyAccessToken(token: string): Promise<string | null> {
  return (await verifyAccessClaims(token))?.sub ?? null;
}
