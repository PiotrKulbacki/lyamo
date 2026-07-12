export const FINANCIAL_MONTH_DAY_MIN = 1;
export const FINANCIAL_MONTH_DAY_MAX = 28;

export const PAST_DUE_GRACE_MS = 24 * 60 * 60 * 1000;

export function clampFinancialMonthDay(day: number): number {
  return Math.min(FINANCIAL_MONTH_DAY_MAX, Math.max(FINANCIAL_MONTH_DAY_MIN, day));
}

export function getFinancialMonthStartDayFromDate(date: Date): number {
  return clampFinancialMonthDay(date.getUTCDate());
}

export function getQuotaPeriodStart(financialMonthStartDay: number, reference: Date): Date {
  const day = clampFinancialMonthDay(financialMonthStartDay);
  const year = reference.getUTCFullYear();
  const month = reference.getUTCMonth();
  const currentDay = reference.getUTCDate();

  if (currentDay >= day) {
    return new Date(Date.UTC(year, month, day));
  }

  return new Date(Date.UTC(year, month - 1, day));
}

export function shouldResetQuotaToday(
  financialMonthStartDay: number,
  lastQuotaResetAt: Date | null,
  reference: Date = new Date()
): boolean {
  const day = clampFinancialMonthDay(financialMonthStartDay);

  if (reference.getUTCDate() !== day) {
    return false;
  }

  const periodStart = getQuotaPeriodStart(day, reference);

  if (!lastQuotaResetAt) {
    return true;
  }

  return lastQuotaResetAt.getTime() < periodStart.getTime();
}

export function isPastDueGraceExpired(
  pastDueSince: Date | null,
  reference: Date = new Date()
): boolean {
  if (!pastDueSince) {
    return false;
  }

  return reference.getTime() - pastDueSince.getTime() >= PAST_DUE_GRACE_MS;
}
