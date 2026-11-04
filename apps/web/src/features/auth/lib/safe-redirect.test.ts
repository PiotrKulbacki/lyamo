import { expect, test } from 'vitest';
import { safeAuthRedirect } from './safe-redirect';

test.each([
  null,
  '',
  'javascript:alert(1)',
  'https://evil.example',
  '//evil.example',
  '/\\evil.example',
  '/%2f%2fevil.example',
  '/%252f%252fevil.example',
  '%2Fdashboard',
  '/dashboard/../login',
  '/login',
  '/api/auth/logout',
  '/dashboard\n',
  '/dashboard\\evil',
  '/dashboard%23x',
])('rejects unsafe or non-app redirect %s', (value) => {
  expect(safeAuthRedirect(value)).toBe('/dashboard');
});

test.each(['/history', '/settings/contact', '/history?month=2026-11#top'])('allows %s', (value) => {
  expect(safeAuthRedirect(value)).toBe(value);
});
