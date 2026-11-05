import { expect, test } from 'vitest';
import { sensitiveLocation } from './privacy';

test('blocks secret pages, callbacks, query strings and addresses', () => {
  for (const value of [
    '/verify-email',
    '/reset-password',
    '/api/auth/google/callback',
    'https://example.invalid/?token=x',
    'test@example.invalid',
  ])
    expect(sensitiveLocation(value)).toBe(true);
  expect(sensitiveLocation('https://example.invalid/dashboard')).toBe(false);
});
