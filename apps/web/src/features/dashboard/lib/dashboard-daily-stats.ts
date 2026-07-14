export type DailyBudgetStats = {
  avgSpentPerDay: number;
  avgRemainingPerDay: number | null;
  cycleEnded: boolean;
};

export function computeDailyBudgetStats(params: {
  visibleTotalSpent: number;
  hiddenTotalSpent: number;
  currentMonthBudget: number | null;
  daysElapsed: number;
  daysUntilPayday: number;
}): DailyBudgetStats {
  const daysElapsed = Math.max(1, params.daysElapsed);
  const avgSpentPerDay = params.visibleTotalSpent / daysElapsed;

  if (params.currentMonthBudget == null || params.currentMonthBudget <= 0) {
    return {
      avgSpentPerDay,
      avgRemainingPerDay: null,
      cycleEnded: false,
    };
  }

  if (params.daysUntilPayday <= 0) {
    return {
      avgSpentPerDay,
      avgRemainingPerDay: null,
      cycleEnded: true,
    };
  }

  const adjustedBudget = Math.max(
    params.currentMonthBudget - Math.max(params.hiddenTotalSpent, 0),
    0
  );
  const remaining = Math.max(adjustedBudget - params.visibleTotalSpent, 0);

  return {
    avgSpentPerDay,
    avgRemainingPerDay: remaining / params.daysUntilPayday,
    cycleEnded: false,
  };
}
