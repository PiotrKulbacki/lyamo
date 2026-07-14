import { addMonths, differenceInCalendarDays } from 'date-fns';
import { getQuotaPeriodStart } from '@shared/features/billing/financial-month';

export type ChartDateRange = 'period' | '7d' | 'today' | 'custom';

export type ChartTransaction = {
  date: string;
  category: string;
  convertedAmount: number;
};

export function getChartRangeStart(
  range: ChartDateRange,
  periodStart: string,
  now = new Date()
): Date {
  if (range === 'custom') {
    return new Date(periodStart);
  }

  if (range === 'today') {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  if (range === '7d') {
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 6);
    start.setUTCHours(0, 0, 0, 0);
    return start;
  }

  return new Date(periodStart);
}

export function aggregateCategoryTotals(
  transactions: ChartTransaction[],
  range: ChartDateRange,
  periodStart: string
): Array<{ category: string; amount: number }> {
  if (range === 'custom') {
    const categoryMap = new Map<string, number>();

    for (const transaction of transactions) {
      categoryMap.set(
        transaction.category,
        (categoryMap.get(transaction.category) ?? 0) + transaction.convertedAmount
      );
    }

    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount);
  }

  const rangeStart = getChartRangeStart(range, periodStart);
  const categoryMap = new Map<string, number>();

  for (const transaction of transactions) {
    const transactionDate = new Date(transaction.date);
    if (transactionDate < rangeStart) {
      continue;
    }

    categoryMap.set(
      transaction.category,
      (categoryMap.get(transaction.category) ?? 0) + transaction.convertedAmount
    );
  }

  return Array.from(categoryMap.entries())
    .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount);
}

export function getChartDataFetchStart(periodStart: Date, now = new Date()): Date {
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
  sevenDaysAgo.setUTCHours(0, 0, 0, 0);

  return periodStart < sevenDaysAgo ? periodStart : sevenDaysAgo;
}

function toUtcCalendarDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function getChartFilterDayMetrics(params: {
  range: ChartDateRange;
  periodStart: string;
  periodEnd?: string;
  financialMonthStartDay: number;
  now?: Date;
}): { daysElapsed: number; daysUntilPayday: number } {
  const now = params.now ?? new Date();
  const billingPeriodStart = getQuotaPeriodStart(params.financialMonthStartDay, now);
  const nextPayday = addMonths(billingPeriodStart, 1);
  const daysUntilPayday = differenceInCalendarDays(
    toUtcCalendarDay(nextPayday),
    toUtcCalendarDay(now)
  );

  if (params.range === 'today') {
    return { daysElapsed: 1, daysUntilPayday };
  }

  if (params.range === '7d') {
    return { daysElapsed: 7, daysUntilPayday };
  }

  if (params.range === 'custom' && params.periodEnd) {
    const rangeStart = toUtcCalendarDay(new Date(params.periodStart));
    const rangeEnd = toUtcCalendarDay(new Date(params.periodEnd));
    const daysElapsed = Math.max(1, differenceInCalendarDays(rangeEnd, rangeStart) + 1);
    return { daysElapsed, daysUntilPayday };
  }

  const daysElapsed = Math.max(
    1,
    differenceInCalendarDays(toUtcCalendarDay(now), toUtcCalendarDay(billingPeriodStart)) + 1
  );

  return { daysElapsed, daysUntilPayday };
}
