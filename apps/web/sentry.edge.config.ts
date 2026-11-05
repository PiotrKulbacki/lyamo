import * as Sentry from '@sentry/nextjs';
import { secretPage, sensitiveTelemetry } from '@web/features/analytics/privacy';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NODE_ENV,
  beforeBreadcrumb(breadcrumb) {
    if (secretPage() || sensitiveTelemetry(breadcrumb)) return null;
    return breadcrumb;
  },
  beforeSend(event) {
    if (secretPage() || sensitiveTelemetry(event)) return null;
    return event;
  },
  beforeSendTransaction(event) {
    if (secretPage() || sensitiveTelemetry(event)) return null;
    return event;
  },
});
