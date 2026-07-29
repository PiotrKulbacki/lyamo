'use client';

import {
  EARLY_ACCESS_PROMO_CODE,
  EARLY_ACCESS_PROMO_MONTHS,
  EARLY_ACCESS_PROMO_SEATS,
} from '@shared/features/billing/pricing';
import { useT } from '@web/features/i18n/LocaleProvider';

type EarlyAccessPromoBannerProps = {
  className?: string;
};

export function EarlyAccessPromoBanner({ className }: EarlyAccessPromoBannerProps) {
  const t = useT();

  return (
    <aside
      className={`border-warm/40 bg-warm/10 relative z-10 rounded-xl border px-4 py-4 sm:px-6 sm:py-5 ${className ?? ''}`}
      aria-label={t('billing.earlyAccess.ariaLabel')}
    >
      <p className="text-sm leading-relaxed text-[var(--text)] sm:text-base">
        {t('billing.earlyAccess.description', {
          seats: EARLY_ACCESS_PROMO_SEATS,
          months: EARLY_ACCESS_PROMO_MONTHS,
        })}
      </p>
      <p className="text-muted mt-3 text-xs sm:text-sm">{t('billing.earlyAccess.codeHint')}</p>
      <code className="border-warm/50 bg-elevated text-warm mt-2 inline-block rounded-lg border px-4 py-2 font-mono text-base font-semibold tracking-widest sm:text-lg">
        {EARLY_ACCESS_PROMO_CODE}
      </code>
    </aside>
  );
}
