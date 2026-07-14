export type PlanType = 'FREE' | 'PRO';

export const UNLIMITED_QUOTA = Number.MAX_SAFE_INTEGER;

export const PLAN_LIMITS = {
  FREE: {
    aiScansPerMonth: 5,
    aiChatMessagesPerMonth: 10,
  },
  PRO: {
    aiScansPerMonth: 150,
    aiChatMessagesPerMonth: UNLIMITED_QUOTA,
  },
} as const;

export type QuotaStatus = {
  limit: number;
  used: number;
  remaining: number;
  canUse: boolean;
  isBlocked: boolean;
};

export type AiScanQuotaStatus = QuotaStatus & {
  canScan: boolean;
};

function buildQuotaStatus(limit: number, used: number): QuotaStatus {
  const remaining = Math.max(0, limit - used);
  const canUse = used < limit;

  return {
    limit,
    used,
    remaining,
    canUse,
    isBlocked: !canUse,
  };
}

export function getAiScanLimit(plan: PlanType): number {
  return PLAN_LIMITS[plan].aiScansPerMonth;
}

export function getAiChatLimit(plan: PlanType): number {
  return PLAN_LIMITS[plan].aiChatMessagesPerMonth;
}

export function getAiScanQuotaStatus(plan: PlanType, scansUsed: number): AiScanQuotaStatus {
  const status = buildQuotaStatus(getAiScanLimit(plan), scansUsed);

  return {
    ...status,
    canScan: status.canUse,
  };
}

export function getAiChatQuotaStatus(plan: PlanType, messagesUsed: number): QuotaStatus {
  return buildQuotaStatus(getAiChatLimit(plan), messagesUsed);
}
