const APP_PATHS = new Set([
  '/dashboard',
  '/history',
  '/scanner',
  '/chat',
  '/settings',
  '/settings/contact',
]);

/** Never pass a query-string value directly to the Next router. */
export function safeAuthRedirect(value: string | null): string {
  if (!value || /[\\\u0000-\u0020\u007f]/.test(value)) return '/dashboard';
  const pathname = value.split(/[?#]/, 1)[0];
  if (!pathname || !APP_PATHS.has(pathname)) return '/dashboard';
  return value;
}
