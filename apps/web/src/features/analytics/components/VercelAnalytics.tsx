'use client';

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';
import { useCookieConsent } from '@web/features/cookie-consent';

/**
 * Vercel Web Analytics, gated behind cookie consent (analytics category).
 * Events are dropped via beforeSend when consent is missing or withdrawn.
 */
export function VercelAnalytics() {
  const { canUseAnalytics, isReady: consentReady } = useCookieConsent();

  if (!consentReady || !canUseAnalytics) {
    return null;
  }

  return (
    <Analytics
      beforeSend={(event: BeforeSendEvent) => {
        // Defence in depth: drop if consent was withdrawn after mount.
        if (!canUseAnalytics) {
          return null;
        }
        return event;
      }}
    />
  );
}
