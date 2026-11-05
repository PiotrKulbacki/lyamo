// Treat all auth URLs and all URLs with a query or fragment as sensitive.
export function sensitiveLocation(value: string): boolean {
  return /(?:\/verify-email|\/reset-password|\/api\/auth|[?#]|%3f|%23|[\w.+-]+@[\w.-]+)/i.test(
    value
  );
}
export function secretPage(): boolean {
  return typeof window !== 'undefined' && sensitiveLocation(window.location.href);
}
