'use client';

import posthog from 'posthog-js';
import { env } from '@web/env';

let initialized = false;

export function initPostHog(): void {
  if (initialized || typeof window === 'undefined') {
    return;
  }

  const key = env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) {
    return;
  }

  posthog.init(key, {
    api_host: env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
  });

  initialized = true;
}

export function getPostHogClient(): typeof posthog | null {
  if (!initialized || !env.NEXT_PUBLIC_POSTHOG_KEY) {
    return null;
  }

  return posthog;
}

export function identifyPostHogUser(userId: string, traits?: Record<string, string>): void {
  const client = getPostHogClient();
  if (!client) {
    return;
  }

  client.identify(userId, traits);
}

export function resetPostHogUser(): void {
  const client = getPostHogClient();
  if (!client) {
    return;
  }

  client.reset();
}
