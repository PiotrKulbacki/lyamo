import { expect, test } from 'vitest';
import { sensitiveLocation, sensitiveTelemetry } from './privacy';

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

test('drops circular SDK objects without throwing from telemetry hooks', () => {
  const timer: { _idlePrev?: unknown } = {};
  timer._idlePrev = timer;
  expect(sensitiveTelemetry({ data: { timer } })).toBe(true);
});

test('drops values that cannot be safely serialized', () => {
  expect(sensitiveTelemetry({ value: BigInt(1) })).toBe(true);
  expect(sensitiveTelemetry(undefined)).toBe(true);
  expect(
    sensitiveTelemetry({
      toJSON() {
        throw new Error('serialization failed');
      },
    })
  ).toBe(true);
});

test('preserves the privacy filter for serializable telemetry', () => {
  expect(sensitiveTelemetry({ request: { url: 'https://example.invalid/dashboard' } })).toBe(false);
  expect(sensitiveTelemetry({ request: { url: '/api/auth/google/callback' } })).toBe(true);
  expect(sensitiveTelemetry({ data: { url: '/dashboard?token=secret' } })).toBe(true);
  expect(sensitiveTelemetry({ user: { email: 'test@example.invalid' } })).toBe(true);
});
