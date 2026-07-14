const CALENDAR_DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toUtcCalendarNoon(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day, 12, 0, 0, 0));
}

function normalizeToUtcCalendarNoon(date: Date): Date {
  return toUtcCalendarNoon(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * Parses a calendar date from form input (`YYYY-MM-DD`) or ISO timestamp.
 * Stored instants always represent noon UTC on the selected calendar day so
 * expense dates stay stable across time zones and daylight saving changes.
 */
export function parseCalendarDateInput(value: unknown): Date {
  if (value instanceof Date) {
    return normalizeToUtcCalendarNoon(value);
  }

  if (typeof value === 'string') {
    if (CALENDAR_DATE_INPUT_PATTERN.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      return toUtcCalendarNoon(year, month - 1, day);
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return normalizeToUtcCalendarNoon(parsed);
    }
  }

  return new Date(Number.NaN);
}

/**
 * Upper bound for transaction queries that must include "today" for users
 * ahead of UTC while they are still on the previous UTC calendar day.
 */
export function getInclusiveTransactionPeriodEnd(reference = new Date()): Date {
  const year = reference.getUTCFullYear();
  const month = reference.getUTCMonth();
  const day = reference.getUTCDate();

  return new Date(Date.UTC(year, month, day + 1, 23, 59, 59, 999));
}

/** Formats a stored transaction date as `YYYY-MM-DD` using its UTC calendar day. */
export function toCalendarDateInputValue(date: Date | string): string {
  const parsed = typeof date === 'string' ? new Date(date) : date;
  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const day = String(parsed.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/** Default value for `<input type="date">` in the user's local calendar. */
export function toLocalDateInputValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
