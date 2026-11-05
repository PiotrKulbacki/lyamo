'use client';

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';
import { secretPage, sensitiveLocation } from '@web/features/analytics/privacy';
import { useCookieConsent } from '@web/features/cookie-consent';
import { usePathname } from 'next/navigation';

/**
 * Vercel Web Analytics, gated behind cookie consent (analytics category).
 * Events are dropped via beforeSend when consent is missing or withdrawn.
 */
export function VercelAnalytics() {
  const { canUseAnalytics, isReady: consentReady } = useCookieConsent();
  const pathname = usePathname();

  if (!consentReady || !canUseAnalytics || sensitiveLocation(pathname) || secretPage()) {
    return null;
  }

  return (
    <Analytics
      beforeSend={(event: BeforeSendEvent) => {
        // Defence in depth: drop if consent was withdrawn after mount.
        if (!canUseAnalytics || secretPage() || sensitiveLocation(event.url)) {
          return null;
        }
        return event;
      }}
    />
  );
}
