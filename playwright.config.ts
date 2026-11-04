import { defineConfig } from '@playwright/test';

if (process.env.LYAMO_TEST_ENV !== '1') {
  throw new Error('Run npm run test:e2e with the isolated environment runner');
}
const baseURL = process.env.NEXT_PUBLIC_APP_URL!;
const url = new URL(baseURL);
if (url.hostname !== '127.0.0.1' || url.protocol !== 'http:') {
  throw new Error('E2E requires the local test server');
}

export default defineConfig({
  testDir: './apps/web/e2e',
  workers: 1,
  retries: 0,
  use: {
    baseURL,
    browserName: 'chromium',
    channel: process.env.LYAMO_TEST_BROWSER_CHANNEL === 'chrome' ? 'chrome' : undefined,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm exec -w web -- next dev --turbopack --hostname 127.0.0.1 --port ${url.port}`,
    url: `${baseURL}/login`,
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
