'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { useT } from '@web/features/i18n/LocaleProvider';

type DashboardDailyStatsProps = {
  avgSpentPerDay: number;
  avgRemainingPerDay: number | null;
  cycleEnded: boolean;
  primaryCurrency: string;
  locale: string;
};

function formatDailyAmount(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function DashboardDailyStats({
  avgSpentPerDay,
  avgRemainingPerDay,
  cycleEnded,
  primaryCurrency,
  locale,
}: DashboardDailyStatsProps) {
  const t = useT();

  return (
    <div className="text-muted-foreground flex w-full items-center justify-between gap-x-3 gap-y-1 text-xs">
      <span className="inline-flex items-center gap-1.5">
        <TrendingUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {t('dashboard.daily.avgSpent', {
          amount: formatDailyAmount(avgSpentPerDay, primaryCurrency, locale),
        })}
      </span>
      {(cycleEnded || avgRemainingPerDay != null) && (
        <span className="inline-flex items-center gap-1.5">
          <TrendingDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {cycleEnded
            ? t('dashboard.daily.cycleEnd')
            : t('dashboard.daily.avgRemaining', {
                amount: formatDailyAmount(avgRemainingPerDay!, primaryCurrency, locale),
              })}
        </span>
      )}
    </div>
  );
}
