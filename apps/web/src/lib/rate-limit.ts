import { claimAuthBudget } from '@web/features/auth/services/auth-throttle.service';
import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { captureMessage } from '@sentry/nextjs';
import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from '@web/env';

const AI_RATE_LIMIT_WINDOW = '1 m';
const CONTACT_RATE_LIMIT_WINDOW = '1 h';
const CONTACT_RATE_LIMIT_MAX = 5;

/** Per-minute burst caps for PRO abuse protection (monthly quota is enforced in DB). */
const AI_RATE_LIMIT_MAX: Record<AiRateLimitScope, number> = {
  scan: 15,
  chat: 30,
};

function shouldFailOpenWithoutRedis(): boolean {
  return true;
}

export type AiRateLimitScope = 'scan' | 'chat';

const UPSTASH_KEY_PREFIX = 'expense-control';

const AI_RATE_LIMIT_PREFIX: Record<AiRateLimitScope, string> = {
  scan: `${UPSTASH_KEY_PREFIX}:ai:scan`,
  chat: `${UPSTASH_KEY_PREFIX}:ai:chat`,
};

const CONTACT_RATE_LIMIT_PREFIX = `${UPSTASH_KEY_PREFIX}:contact`;
const AUTH_RATE_LIMIT_PREFIX = `${UPSTASH_KEY_PREFIX}:auth`;

let redisClient: Redis | null | undefined;
const aiRateLimiters: Partial<Record<AiRateLimitScope, Ratelimit>> = {};
let contactRateLimiter: Ratelimit | null | undefined;

function getRedisClient(): Redis | null {
  if (redisClient !== undefined) {
    return redisClient;
  }

  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = null;
    return null;
  }

  redisClient = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });

  return redisClient;
}

function getAiRateLimiter(scope: AiRateLimitScope): Ratelimit | null {
  const existing = aiRateLimiters[scope];
  if (existing) {
    return existing;
  }

  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(AI_RATE_LIMIT_MAX[scope], AI_RATE_LIMIT_WINDOW),
    prefix: AI_RATE_LIMIT_PREFIX[scope],
    analytics: true,
  });

  aiRateLimiters[scope] = limiter;
  return limiter;
}

function getContactRateLimiter(): Ratelimit | null {
  if (contactRateLimiter !== undefined) {
    return contactRateLimiter;
  }

  const redis = getRedisClient();
  if (!redis) {
    contactRateLimiter = null;
    return null;
  }

  contactRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(CONTACT_RATE_LIMIT_MAX, CONTACT_RATE_LIMIT_WINDOW),
    prefix: CONTACT_RATE_LIMIT_PREFIX,
    analytics: true,
  });

  return contactRateLimiter;
}

/** Only Vercel's ingress may supply this header. Other hosts share an unknown bucket
 * until their proxy trust contract is explicitly implemented. Never parse caller XFF.
 * https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for
 */
export function getClientIp(request: Request): string {
  if (process.env.VERCEL !== '1') return 'unknown';
  const ip = request.headers.get('x-vercel-forwarded-for')?.trim();
  if (!ip || !isIP(ip)) return 'unknown';
  // Canonicalize alternate IPv6 spellings before keying the limiter.
  return isIP(ip) === 6 ? new URL(`http://[${ip}]/`).hostname : ip;
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  reset: number;
  limit: number;
  key: string;
};

function buildRateLimitKey(scope: AiRateLimitScope, identifier: string): string {
  return `${AI_RATE_LIMIT_PREFIX[scope]}:${identifier}`;
}

function isStrictProduction(): boolean {
  return (
    process.env.VERCEL_ENV === 'production' ||
    (!process.env.VERCEL && process.env.NODE_ENV === 'production')
  );
}

function resolveMissingLimiter(key: string, limit: number): RateLimitResult {
  const failOpen = shouldFailOpenWithoutRedis();

  if (isStrictProduction() && !failOpen) {
    console.log(`Rate Limit Check: Key: ${key}, Remaining: 0, Total: ${limit} (no Redis, blocked)`);
    return { allowed: false, remaining: 0, reset: 0, limit, key };
  }

  console.log(
    `Rate Limit Check: Key: ${key}, Remaining: ${limit}, Total: ${limit} (no Redis, fail-open)`
  );
  return { allowed: true, remaining: limit, reset: 0, limit, key };
}

function resolveLimiterError(key: string, limit: number): RateLimitResult {
  const failOpen = shouldFailOpenWithoutRedis();

  if (isStrictProduction() && !failOpen) {
    console.log(
      `Rate Limit Check: Key: ${key}, Remaining: 0, Total: ${limit} (Redis error, blocked)`
    );
    return { allowed: false, remaining: 0, reset: 0, limit, key };
  }

  console.log(
    `Rate Limit Check: Key: ${key}, Remaining: ${limit}, Total: ${limit} (Redis error, fail-open)`
  );
  return { allowed: true, remaining: limit, reset: 0, limit, key };
}

export async function checkAiRateLimit(
  request: Request,
  scope: AiRateLimitScope,
  userId?: string
): Promise<RateLimitResult> {
  const limit = AI_RATE_LIMIT_MAX[scope];
  const identifier = userId ?? `ip:${getClientIp(request)}`;
  const key = buildRateLimitKey(scope, identifier);
  const limiter = getAiRateLimiter(scope);

  if (!limiter) {
    return resolveMissingLimiter(key, limit);
  }

  try {
    const result = await limiter.limit(identifier);

    console.log(`Rate Limit Check: Key: ${key}, Remaining: ${result.remaining}, Total: ${limit}`);

    return {
      allowed: result.success,
      remaining: result.remaining,
      reset: result.reset,
      limit,
      key,
    };
  } catch {
    return resolveLimiterError(key, limit);
  }
}

export async function checkContactRateLimit(request: Request): Promise<RateLimitResult> {
  const identifier = `ip:${getClientIp(request)}`;
  const key = `${CONTACT_RATE_LIMIT_PREFIX}:${identifier}`;
  const limiter = getContactRateLimiter();

  if (!limiter) {
    return resolveMissingLimiter(key, CONTACT_RATE_LIMIT_MAX);
  }

  try {
    const result = await limiter.limit(identifier);

    console.log(
      `Rate Limit Check: Key: ${key}, Remaining: ${result.remaining}, Total: ${CONTACT_RATE_LIMIT_MAX}`
    );

    return {
      allowed: result.success,
      remaining: result.remaining,
      reset: result.reset,
      limit: CONTACT_RATE_LIMIT_MAX,
      key,
    };
  } catch {
    return resolveLimiterError(key, CONTACT_RATE_LIMIT_MAX);
  }
}

// Account windows expire: throttling never changes account state or credentials.
export const AUTH_BUDGETS = {
  login: { ip: 120, subject: 5, window: '1 m' },
  register: { ip: 30, subject: 3, window: '1 h' },
  'forgot-password': { ip: 60, subject: 5, window: '1 h' },
  'resend-verification': { ip: 60, subject: 5, window: '1 h' },
  'reset-password': { ip: 60, subject: 10, window: '15 m' },
  'verify-email': { ip: 120, subject: 10, window: '15 m' },
  refresh: { ip: 600, subject: 60, window: '1 m' },
  'change-password': { ip: 60, subject: 10, window: '15 m' },
  reauth: { ip: 60, subject: 10, window: '15 m' },
  google: { ip: 120, subject: 120, window: '15 m' },
} as const;
export type AuthRateLimitScope = keyof typeof AUTH_BUDGETS;
type AuthLimitResult = RateLimitResult & { unavailable?: boolean };
const authLimiters = new Map<string, Ratelimit>();
let lastAuthAlarm = 0;

function authUnavailable(scope: AuthRateLimitScope): AuthLimitResult {
  // One alert per warm instance per minute. Never include identifiers or Redis errors.
  if (Date.now() - lastAuthAlarm >= 60_000) {
    lastAuthAlarm = Date.now();
    console.error('AUTH_RATE_LIMIT_UNAVAILABLE', { scope });
    captureMessage('AUTH_RATE_LIMIT_UNAVAILABLE', { level: 'error', tags: { scope } });
  }
  return {
    allowed: false,
    unavailable: true,
    remaining: 0,
    reset: Date.now() + 60_000,
    limit: 0,
    key: scope,
  };
}

async function authBudget(
  scope: AuthRateLimitScope,
  bucket: string,
  value: string,
  max: number,
  window: '1 m' | '1 h' | '15 m'
): Promise<AuthLimitResult> {
  // Domain-separated keyed digest prevents email dictionary attacks against Redis keys.
  const digest = createHmac('sha256', env.AUTH_SECRET)
    .update(`lyamo-auth-limit-v2:${bucket}:${value}`)
    .digest('hex');
  const prefix = `${AUTH_RATE_LIMIT_PREFIX}:v2:${bucket}`;
  const fallback = async () => {
    authUnavailable(scope); // alarm also on successful fallback
    try {
      const windowMs = window === '1 m' ? 60_000 : window === '1 h' ? 3600_000 : 900_000;
      return await claimAuthBudget(`${prefix}:${digest}`, max, windowMs);
    } catch {
      return authUnavailable(scope);
    }
  };
  try {
    const redis = getRedisClient();
    if (!redis) return fallback();
    let limiter = authLimiters.get(prefix);
    if (!limiter) {
      limiter = new Ratelimit({
        redis,
        prefix,
        limiter: Ratelimit.slidingWindow(max, window),
        analytics: false,
        timeout: 1500,
        ephemeralCache: false,
      });
      authLimiters.set(prefix, limiter);
    }
    const result = await limiter.limit(digest);
    // The SDK returns success on timeout by default; auth must fail closed instead.
    if (result.reason === 'timeout') return fallback();
    return {
      allowed: result.success,
      remaining: result.remaining,
      reset: result.reset,
      limit: max,
      key: prefix,
    };
  } catch {
    return fallback();
  }
}

/** With no subject consumes the IP budget. With subject consumes only global account/
 * mailbox/token budgets, after bounded schema validation and before DB/hash/mail work.
 */
export async function checkAuthRateLimit(
  request: Request,
  scope: AuthRateLimitScope,
  subject?: string
): Promise<AuthLimitResult> {
  const budget = AUTH_BUDGETS[scope];
  if (subject === undefined)
    return authBudget(scope, `${scope}:ip`, getClientIp(request), budget.ip, budget.window);
  const result = await authBudget(
    scope,
    `${scope}:subject`,
    subject.trim().toLowerCase(),
    budget.subject,
    budget.window
  );
  if (!result.allowed) return result;
  if (scope === 'login')
    return authBudget(scope, 'login:sustained', subject.trim().toLowerCase(), 30, '15 m');
  // Shared mailbox allowance: changing operation/IP cannot multiply mail delivery.
  if (scope === 'register' || scope === 'forgot-password' || scope === 'resend-verification')
    return authBudget(scope, 'mail:subject', subject.trim().toLowerCase(), 6, '1 h');
  return result;
}

export function authRateLimitResponse(result: AuthLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: result.unavailable
        ? 'auth.errors.temporarilyUnavailable'
        : 'api.errors.rateLimitExceeded',
    },
    {
      status: result.unavailable ? 503 : 429,
      headers: {
        'Retry-After': String(Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))),
        'Cache-Control': 'no-store',
      },
    }
  );
}
