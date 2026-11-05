import { expect, test, vi } from 'vitest';
import { buildResetPasswordEmail } from './reset-password';
vi.mock('@web/env', () => ({ env: { NEXT_PUBLIC_APP_URL: 'https://example.invalid' } }));
test.each(['pl', 'en', 'de', 'es'])(
  'reset uses a fragment and translated content: %s',
  (locale) => {
    const message = buildResetPasswordEmail({ token: 'synthetic-secret', locale });
    expect(message.text).toContain('/reset-password#token=synthetic-secret');
    expect(message.html).not.toContain('email.reset.');
  }
);
