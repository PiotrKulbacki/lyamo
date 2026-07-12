import { PostHog } from 'posthog-node';
import { env } from '@web/env';
import type { AnalyticsEvent, AnalyticsEventProperties } from '@web/features/analytics/events';

let posthogClient: PostHog | null = null;

function getPostHogServer(): PostHog | null {
  const apiKey = env.POSTHOG_API_KEY ?? env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) {
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(apiKey, {
      host: env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return posthogClient;
}

export function captureServerEvent<E extends AnalyticsEvent>(
  distinctId: string,
  event: E,
  properties: AnalyticsEventProperties[E]
): void {
  const client = getPostHogServer();
  if (!client) {
    return;
  }

  client.capture({
    distinctId,
    event,
    properties,
  });
}

export async function shutdownPostHog(): Promise<void> {
  if (posthogClient) {
    await posthogClient.shutdown();
    posthogClient = null;
  }
}
