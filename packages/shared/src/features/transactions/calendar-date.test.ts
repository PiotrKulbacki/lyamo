import { describe, expect, it } from 'vitest';
import {
  getInclusiveTransactionPeriodEnd,
  parseCalendarDateInput,
  toCalendarDateInputValue,
  toLocalDateInputValue,
} from './calendar-date';

describe('parseCalendarDateInput', () => {
  it('parses YYYY-MM-DD as noon UTC on that calendar day', () => {
    const parsed = parseCalendarDateInput('2026-07-14');

    expect(parsed.toISOString()).toBe('2026-07-14T12:00:00.000Z');
  });

  it('normalizes ISO timestamps to noon UTC on their UTC calendar day', () => {
    const parsed = parseCalendarDateInput('2026-07-14T10:00:00.000Z');

    expect(parsed.toISOString()).toBe('2026-07-14T12:00:00.000Z');
  });
});

describe('getInclusiveTransactionPeriodEnd', () => {
  it('includes transactions dated on the next UTC calendar day', () => {
    const reference = new Date('2026-07-13T23:29:00.000Z');
    const periodEnd = getInclusiveTransactionPeriodEnd(reference);
    const transactionDate = parseCalendarDateInput('2026-07-14');

    expect(transactionDate.getTime()).toBeLessThanOrEqual(periodEnd.getTime());
  });
});

describe('toCalendarDateInputValue', () => {
  it('formats stored UTC calendar dates for date inputs', () => {
    expect(toCalendarDateInputValue('2026-07-14T12:00:00.000Z')).toBe('2026-07-14');
  });
});

describe('toLocalDateInputValue', () => {
  it('uses the local calendar day', () => {
    const localDate = new Date(2026, 6, 14, 1, 29, 0);

    expect(toLocalDateInputValue(localDate)).toBe('2026-07-14');
  });
});
