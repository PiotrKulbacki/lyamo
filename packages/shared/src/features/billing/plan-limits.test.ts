import { describe, expect, it } from 'vitest';
import {
  getAiChatLimit,
  getAiChatQuotaStatus,
  getAiScanLimit,
  getAiScanQuotaStatus,
  PLAN_LIMITS,
  UNLIMITED_QUOTA,
} from './plan-limits';

describe('plan-limits', () => {
  it('defines FREE and PRO scan limits', () => {
    expect(PLAN_LIMITS.FREE.aiScansPerMonth).toBe(5);
    expect(PLAN_LIMITS.PRO.aiScansPerMonth).toBe(150);
  });

  it('defines chat limits', () => {
    expect(PLAN_LIMITS.FREE.aiChatMessagesPerMonth).toBe(10);
    expect(PLAN_LIMITS.PRO.aiChatMessagesPerMonth).toBe(UNLIMITED_QUOTA);
  });

  it('reports remaining scans for FREE user', () => {
    const status = getAiScanQuotaStatus('FREE', 2);
    expect(status.remaining).toBe(3);
    expect(status.canScan).toBe(true);
    expect(status.isBlocked).toBe(false);
  });

  it('blocks FREE user after 5 scans', () => {
    const status = getAiScanQuotaStatus('FREE', 5);
    expect(status.canScan).toBe(false);
    expect(status.isBlocked).toBe(true);
    expect(getAiScanLimit('FREE')).toBe(5);
  });

  it('blocks PRO user at 150 scans', () => {
    const status = getAiScanQuotaStatus('PRO', 150);
    expect(status.canScan).toBe(false);
    expect(status.isBlocked).toBe(true);
  });

  it('blocks FREE user after 10 chat messages', () => {
    const status = getAiChatQuotaStatus('FREE', 10);
    expect(status.canUse).toBe(false);
    expect(status.isBlocked).toBe(true);
    expect(getAiChatLimit('FREE')).toBe(10);
  });

  it('allows PRO user unlimited chat messages in practice', () => {
    const status = getAiChatQuotaStatus('PRO', 10_000);
    expect(status.canUse).toBe(true);
    expect(status.isBlocked).toBe(false);
  });
});
