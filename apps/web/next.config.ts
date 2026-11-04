import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

// The isolated test runner supplies every setting and must never load local service secrets.
if (process.env.LYAMO_TEST_ENV !== '1') {
  loadEnvConfig(path.resolve(__dirname, '../..'));
}

const nextConfig: NextConfig = {
  transpilePackages: ['@lyamo/shared', '@lyamo/database'],
};

const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
const hasSentryAuthToken = Boolean(sentryAuthToken);

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: sentryAuthToken,
  // Log build/plugin output in CI only when upload is actually configured.
  silent: !process.env.CI || !hasSentryAuthToken,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: true,
  ...(hasSentryAuthToken
    ? {}
    : {
        sourcemaps: { disable: true },
        release: { create: false },
      }),
});
