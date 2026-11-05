import { prisma } from '@lyamo/database';

/** Atomic fixed window anchored at first claim, shared by all serverless instances.
 * DB time avoids application clock skew; denied traffic does not extend the window.
 */
export async function claimAuthBudget(key: string, limit: number, windowMs: number) {
  const [row] = await prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SET LOCAL statement_timeout = '1500ms'`;
      await tx.$executeRaw`SET LOCAL lock_timeout = '1000ms'`;
      return tx.$queryRaw<{ count: number; reset: Date }[]>`
      INSERT INTO auth_rate_buckets (key, count, "expiresAt")
      VALUES (${key}, 1, clock_timestamp() + ${windowMs} * interval '1 millisecond')
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN auth_rate_buckets."expiresAt" <= clock_timestamp() THEN 1
          ELSE LEAST(auth_rate_buckets.count + 1, ${limit + 1}) END,
        "expiresAt" = CASE WHEN auth_rate_buckets."expiresAt" <= clock_timestamp()
          THEN clock_timestamp() + ${windowMs} * interval '1 millisecond'
          ELSE auth_rate_buckets."expiresAt" END
      RETURNING count, "expiresAt" AS reset`;
    },
    { maxWait: 1500, timeout: 2500 }
  );
  return {
    allowed: row.count <= limit,
    remaining: Math.max(0, limit - row.count),
    reset: row.reset.getTime(),
    limit,
    key: 'postgres-auth',
  };
}
