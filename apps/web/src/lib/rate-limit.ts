import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from '@web/env';

const AI_RATE_LIMIT_WINDOW = '1 m';

/** Scan: strict per-minute cap. Chat: abuse-only burst cap (monthly quota is enforced in DB). */
const AI_RATE_LIMIT_MAX: Record<AiRateLimitScope, number> = {
  scan: 5,
  chat: 30,
};

function shouldFailOpenWithoutRedis(scope: AiRateLimitScope): boolean {
  return scope === 'chat';
}

export type AiRateLimitScope = 'scan' | 'chat';

const UPSTASH_KEY_PREFIX = 'expense-control';

const AI_RATE_LIMIT_PREFIX: Record<AiRateLimitScope, string> = {
  scan: `${UPSTASH_KEY_PREFIX}:ai:scan`,
  chat: `${UPSTASH_KEY_PREFIX}:ai:chat`,
};

let redisClient: Redis | null | undefined;
const aiRateLimiters: Partial<Record<AiRateLimitScope, Ratelimit>> = {};

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

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  reset: number;
};

function isStrictProduction(): boolean {
  return (
    process.env.VERCEL_ENV === 'production' ||
    (!process.env.VERCEL && process.env.NODE_ENV === 'production')
  );
}

export async function checkAiRateLimit(
  request: Request,
  scope: AiRateLimitScope,
  userId?: string
): Promise<RateLimitResult> {
  const limiter = getAiRateLimiter(scope);

  if (!limiter) {
    const failOpen = shouldFailOpenWithoutRedis(scope);

    if (isStrictProduction() && !failOpen) {
      return { allowed: false, remaining: 0, reset: 0 };
    }

    return { allowed: true, remaining: AI_RATE_LIMIT_MAX[scope], reset: 0 };
  }

  const identifier = userId ?? `ip:${getClientIp(request)}`;

  try {
    const result = await limiter.limit(identifier);

    return {
      allowed: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch {
    const failOpen = shouldFailOpenWithoutRedis(scope);

    if (isStrictProduction() && !failOpen) {
      return { allowed: false, remaining: 0, reset: 0 };
    }

    return { allowed: true, remaining: AI_RATE_LIMIT_MAX[scope], reset: 0 };
  }
}
