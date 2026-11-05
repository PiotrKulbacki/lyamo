/** Respect server cooldown without automatic retries (especially mail and refresh).
 * Store only operation paths, never addresses, credentials or tokens.
 */
const cooldowns = new Map<string, { until: number; status: number; error: string }>();
export function retryAfterSeconds(value: string | null, now = Date.now()): number {
  const seconds = value === null ? 60 : Number(value);
  const parsed = Number.isFinite(seconds) ? seconds : (Date.parse(value ?? '') - now) / 1000;
  return Math.min(3600, Math.max(1, Math.ceil(Number.isFinite(parsed) ? parsed : 60)));
}
export async function authFetch(url: string, options?: RequestInit): Promise<Response> {
  const operation = new URL(url, 'https://local.invalid').pathname;
  const cooldown = cooldowns.get(operation);
  if (cooldown && cooldown.until > Date.now())
    return new Response(JSON.stringify({ error: cooldown.error }), {
      status: cooldown.status,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil((cooldown.until - Date.now()) / 1000)),
      },
    });
  const response = await fetch(url, options);
  if (response.status === 429 || response.status === 503) {
    cooldowns.set(operation, {
      until: Date.now() + retryAfterSeconds(response.headers.get('Retry-After')) * 1000,
      status: response.status,
      error:
        response.status === 429
          ? 'api.errors.rateLimitExceeded'
          : 'auth.errors.temporarilyUnavailable',
    });
  } else cooldowns.delete(operation);
  return response;
}
