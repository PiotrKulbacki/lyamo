// Treat all auth URLs and all URLs with a query or fragment as sensitive.
export function sensitiveLocation(value: string): boolean {
  return /(?:\/verify-email|\/reset-password|\/api\/auth|[?#]|%3f|%23|[\w.+-]+@[\w.-]+)/i.test(
    value
  );
}
export function secretPage(): boolean {
  return typeof window !== 'undefined' && sensitiveLocation(window.location.href);
}

// Sentry hooks may receive live SDK objects (including circular timers/clients).
// Drop anything we cannot inspect instead of throwing from the telemetry hook.
export function sensitiveTelemetry(value: unknown): boolean {
  try {
    const serialized = JSON.stringify(value);
    return serialized === undefined || sensitiveLocation(serialized);
  } catch {
    return true;
  }
}
