import { Prisma, prisma } from '@lyamo/database';

// Only registrations explicitly enrolled by the new register endpoint qualify.
// Never delete confirmed, linked, signed-in, paid or non-empty accounts.
export async function deleteExpiredRegistrations(now = new Date()): Promise<number> {
  const where: Prisma.UserWhereInput = {
    registrationExpiresAt: { lte: now },
    emailVerifiedAt: null,
    passwordHash: { not: null },
    currentPlan: 'FREE',
    stripeCustomerId: null,
    accounts: { none: {} },
    sessions: { none: {} },
    refreshTokens: { none: {} },
    transactions: { none: {} },
    recurringExpenses: { none: {} },
    chatMessages: { none: {} },
    userCategories: { none: {} },
    categoryLimits: { none: {} },
    periodAggregations: { none: {} },
    aiInsight: { is: null },
  };
  const candidates = await prisma.user.findMany({
    where,
    select: { id: true },
    orderBy: { registrationExpiresAt: 'asc' },
    take: 500,
  });
  if (!candidates.length) return 0;
  // Recheck every eligibility condition in the delete statement, so a
  // concurrent verification cannot leave a confirmed account in this batch.
  const result = await prisma.user.deleteMany({
    where: { ...where, id: { in: candidates.map(({ id }) => id) } },
  });
  return result.count;
}
