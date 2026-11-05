import * as Sentry from '@sentry/nextjs';
import { secretPage, sensitiveLocation } from '@web/features/analytics/privacy';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NODE_ENV,
  beforeBreadcrumb(breadcrumb) {
    if (secretPage() || sensitiveLocation(JSON.stringify(breadcrumb))) return null;
    return breadcrumb;
  },
  beforeSend(event) {
    // Explicit operational signal: strip request/breadcrumb/user data before allowing
    // it through the auth URL filter. No credentials or identifier can be attached.
    if (event.message === 'AUTH_RATE_LIMIT_UNAVAILABLE')
      return {
        type: event.type,
        event_id: event.event_id,
        timestamp: event.timestamp,
        level: 'error',
        message: 'AUTH_RATE_LIMIT_UNAVAILABLE',
      };
    if (secretPage() || sensitiveLocation(JSON.stringify(event))) return null;
    return event;
  },
  beforeSendTransaction(event) {
    if (secretPage() || sensitiveLocation(JSON.stringify(event))) return null;
    return event;
  },
});
