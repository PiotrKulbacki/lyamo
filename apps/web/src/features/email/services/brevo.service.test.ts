import { afterEach, expect, test, vi } from 'vitest';
import { sendTransactionalEmail } from './brevo.service';
vi.mock('@web/env', () => ({
  env: { BREVO_API_KEY: 'synthetic', BREVO_FROM_EMAIL: 'test@example.invalid' },
}));
vi.mock('@web/lib/sentry-server', () => ({ captureServerException: vi.fn() }));
afterEach(() => vi.unstubAllGlobals());
const mail = {
  to: 'test@example.invalid',
  subject: 'subject',
  text: 'text',
  html: '<p>text</p>',
  idempotencyKey: '57ad0800-42ae-40b3-9d79-4b478131f6c1',
};
test('provider duplicate acknowledgement completes the same job', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ code: 'duplicate_parameter' }), { status: 400 })
      )
  );
  expect(await sendTransactionalEmail(mail)).toEqual({ ok: true });
});
test('provider failures and timeouts return a retryable failure', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));
  expect((await sendTransactionalEmail(mail)).ok).toBe(false);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 503 })));
  expect((await sendTransactionalEmail(mail)).ok).toBe(false);
});
