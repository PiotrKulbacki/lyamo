'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { initPostHog, getPostHogClient } from '@web/features/analytics/posthog-client';

type FeatureFlagsContextValue = {
  isReady: boolean;
  isFeatureEnabled: (flagKey: string) => boolean;
};

const FeatureFlagsContext = createContext<FeatureFlagsContextValue>({
  isReady: false,
  isFeatureEnabled: () => false,
});

export function useFeatureFlag(flagKey: string): boolean {
  const { isFeatureEnabled } = useContext(FeatureFlagsContext);
  return isFeatureEnabled(flagKey);
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [flagsVersion, setFlagsVersion] = useState(0);

  useEffect(() => {
    initPostHog();
    const client = getPostHogClient();

    if (!client) {
      setIsReady(true);
      return;
    }

    client.onFeatureFlags(() => {
      setFlagsVersion((version) => version + 1);
      setIsReady(true);
    });

    const timeout = setTimeout(() => setIsReady(true), 3000);
    return () => clearTimeout(timeout);
  }, []);

  const isFeatureEnabled = useCallback(
    (flagKey: string): boolean => {
      const client = getPostHogClient();
      return client?.isFeatureEnabled(flagKey) ?? false;
    },
    [flagsVersion]
  );

  return (
    <FeatureFlagsContext.Provider value={{ isReady, isFeatureEnabled }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}
