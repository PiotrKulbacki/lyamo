import { expect, test, vi } from 'vitest';
import { buildVerifyEmail } from './verify-email';
vi.mock('@web/env', () => ({ env: { NEXT_PUBLIC_APP_URL: 'https://example.invalid' } }));

test.each(['pl', 'en', 'de', 'es'])(
  'new registrations include expiry notice in text and HTML: %s',
  (locale) => {
    const legacy = buildVerifyEmail({ token: 'synthetic', locale });
    const pending = buildVerifyEmail({
      token: 'synthetic',
      locale,
      registrationExpiresAt: new Date(),
    });
    expect(pending.text.length).toBeGreaterThan(legacy.text.length);
    expect(pending.html.length).toBeGreaterThan(legacy.html.length);
    expect(pending.text).not.toContain('auth.verify.registrationExpiry');
    expect(pending.text).toContain('3');
  }
);

test.each(['pl', 'en', 'de', 'es'])(
  'verification uses a fragment without untranslated content: %s',
  (locale) => {
    const message = buildVerifyEmail({ token: 'synthetic-secret', locale });
    expect(message.text).toContain('/verify-email#token=synthetic-secret');
    expect(message.html).not.toContain('email.verify.');
  }
);
