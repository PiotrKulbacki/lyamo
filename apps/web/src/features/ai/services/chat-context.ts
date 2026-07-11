import type { Locale } from '@shared/features/i18n';

export type FinancialContext = {
  currentMonthLabel: string;
  totalSpentThisMonth: number;
  categoryTotals: Array<{ category: string; total: number; currency: string }>;
  recentTransactions: Array<{
    date: string;
    amount: number;
    currency: string;
    category: string;
    description: string | null;
  }>;
};

export type MonthlyTransactionSnapshot = {
  amount: number;
  currency: string;
  category: string;
};

export type RecentTransactionSnapshot = MonthlyTransactionSnapshot & {
  description: string | null;
  date: Date;
};

const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  de: 'German',
  pl: 'Polish',
  es: 'Spanish',
};

export function aggregateFinancialContext(
  monthLabel: string,
  monthlyTransactions: MonthlyTransactionSnapshot[],
  recentTransactions: RecentTransactionSnapshot[]
): FinancialContext {
  const categoryMap = new Map<string, { total: number; currency: string }>();

  for (const transaction of monthlyTransactions) {
    const key = `${transaction.category}::${transaction.currency}`;
    const existing = categoryMap.get(key);

    if (existing) {
      existing.total += transaction.amount;
    } else {
      categoryMap.set(key, { total: transaction.amount, currency: transaction.currency });
    }
  }

  const categoryTotals = Array.from(categoryMap.entries()).map(([key, value]) => {
    const [category] = key.split('::');
    return {
      category,
      total: Math.round(value.total * 100) / 100,
      currency: value.currency,
    };
  });

  const totalSpentThisMonth = monthlyTransactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0
  );

  return {
    currentMonthLabel: monthLabel,
    totalSpentThisMonth: Math.round(totalSpentThisMonth * 100) / 100,
    categoryTotals,
    recentTransactions: recentTransactions.map((transaction) => ({
      date: transaction.date.toISOString().slice(0, 10),
      amount: transaction.amount,
      currency: transaction.currency,
      category: transaction.category,
      description: transaction.description,
    })),
  };
}

export function buildChatSystemPrompt(context: FinancialContext, locale: Locale): string {
  const language = LOCALE_NAMES[locale];

  return `You are a helpful personal finance assistant for Smart Expense Control.
Always respond in ${language}.
Use the user's transaction data below to answer spending questions accurately.
If data is missing, say so clearly and suggest adding transactions.
Never invent transactions or amounts not present in the context.
Keep answers concise, practical, and friendly.

Current month: ${context.currentMonthLabel}
Total spent this month (all currencies, not converted): ${context.totalSpentThisMonth}

Category totals this month:
${context.categoryTotals.length > 0 ? JSON.stringify(context.categoryTotals, null, 2) : 'No transactions this month.'}

Recent transactions (newest first):
${context.recentTransactions.length > 0 ? JSON.stringify(context.recentTransactions, null, 2) : 'No transactions on record.'}`;
}
