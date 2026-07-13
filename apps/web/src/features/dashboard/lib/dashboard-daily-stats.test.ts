import { describe, expect, it } from 'vitest';
import { computeDailyBudgetStats } from './dashboard-daily-stats';

describe('computeDailyBudgetStats', () => {
  it('computes averages from visible total and filter day metrics', () => {
    const stats = computeDailyBudgetStats({
      visibleTotalSpent: 340,
      hiddenTotalSpent: 0,
      currentMonthBudget: 2000,
      daysElapsed: 13,
      daysUntilPayday: 19,
    });

    expect(stats.avgSpentPerDay).toBeCloseTo(340 / 13);
    expect(stats.avgRemainingPerDay).toBeCloseTo((2000 - 340) / 19);
    expect(stats.cycleEnded).toBe(false);
  });

  it('reduces analysis budget by hidden category totals before computing remaining daily average', () => {
    const stats = computeDailyBudgetStats({
      visibleTotalSpent: 340,
      hiddenTotalSpent: 500,
      currentMonthBudget: 2000,
      daysElapsed: 13,
      daysUntilPayday: 19,
    });

    expect(stats.avgSpentPerDay).toBeCloseTo(340 / 13);
    expect(stats.avgRemainingPerDay).toBeCloseTo((1500 - 340) / 19);
    expect(stats.cycleEnded).toBe(false);
  });

  it('returns cycleEnded when days until payday is zero or negative', () => {
    const stats = computeDailyBudgetStats({
      visibleTotalSpent: 900,
      hiddenTotalSpent: 0,
      currentMonthBudget: 1000,
      daysElapsed: 31,
      daysUntilPayday: 0,
    });

    expect(stats.cycleEnded).toBe(true);
    expect(stats.avgRemainingPerDay).toBeNull();
  });

  it('omits remaining daily average when budget is not set', () => {
    const stats = computeDailyBudgetStats({
      visibleTotalSpent: 120,
      hiddenTotalSpent: 0,
      currentMonthBudget: null,
      daysElapsed: 5,
      daysUntilPayday: 20,
    });

    expect(stats.avgSpentPerDay).toBeCloseTo(24);
    expect(stats.avgRemainingPerDay).toBeNull();
    expect(stats.cycleEnded).toBe(false);
  });
});
