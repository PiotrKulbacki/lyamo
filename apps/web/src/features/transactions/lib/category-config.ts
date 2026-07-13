import {
  Car,
  CircleEllipsis,
  Coffee,
  Film,
  Fuel,
  HeartPulse,
  Hotel,
  Landmark,
  ShoppingCart,
  Sparkles,
  Utensils,
  Wine,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import {
  FIXED_COSTS_CATEGORY,
  FIXED_COSTS_CHART_COLOR,
  FIXED_COSTS_I18N_KEY,
} from '@shared/features/transactions/fixed-costs';
import {
  isBuiltInCategory,
  isCustomCategoryKey,
  type TransactionCategory,
} from '@shared/features/transactions/categories';

export const CATEGORY_I18N_KEYS: Record<TransactionCategory, string> = {
  Groceries: 'transactions.categories.groceries',
  Transport: 'transactions.categories.transport',
  CoffeeShop: 'transactions.categories.coffeeShop',
  Restaurants: 'transactions.categories.restaurants',
  Entertainment: 'transactions.categories.entertainment',
  Health: 'transactions.categories.health',
  Fuel: 'transactions.categories.fuel',
  Household: 'transactions.categories.household',
  Cosmetics: 'transactions.categories.cosmetics',
  Hotels: 'transactions.categories.hotels',
  Alcohol: 'transactions.categories.alcohol',
  Accounting: 'transactions.categories.accounting',
  Mechanic: 'transactions.categories.mechanic',
  Other: 'transactions.categories.other',
};

export const CATEGORY_ICONS: Record<TransactionCategory, LucideIcon> = {
  Groceries: ShoppingCart,
  Transport: Car,
  CoffeeShop: Coffee,
  Restaurants: Utensils,
  Entertainment: Film,
  Health: HeartPulse,
  Fuel: Fuel,
  Household: Sparkles,
  Cosmetics: Sparkles,
  Hotels: Hotel,
  Alcohol: Wine,
  Accounting: Landmark,
  Mechanic: Wrench,
  Other: CircleEllipsis,
};

export const CATEGORY_CHART_COLORS: Record<TransactionCategory, string> = {
  Groceries: '#16a34a',
  Transport: '#2563eb',
  CoffeeShop: '#d97706',
  Restaurants: '#ea580c',
  Entertainment: '#9333ea',
  Health: '#dc2626',
  Fuel: '#0891b2',
  Household: '#0d9488',
  Cosmetics: '#ec4899',
  Hotels: '#7c3aed',
  Alcohol: '#b45309',
  Accounting: '#475569',
  Mechanic: '#64748b',
  Other: '#9ca3af',
};

export const CATEGORY_ICON_STYLES: Record<TransactionCategory, { bg: string; text: string }> = {
  Groceries: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  Transport: { bg: 'bg-cool/15', text: 'text-cool' },
  CoffeeShop: { bg: 'bg-warm/15', text: 'text-warm' },
  Restaurants: { bg: 'bg-orange-500/15', text: 'text-orange-400' },
  Entertainment: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
  Health: { bg: 'bg-glow/15', text: 'text-glow' },
  Fuel: { bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
  Household: { bg: 'bg-teal-500/15', text: 'text-teal-400' },
  Cosmetics: { bg: 'bg-pink-500/15', text: 'text-pink-400' },
  Hotels: { bg: 'bg-violet-500/15', text: 'text-violet-400' },
  Alcohol: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
  Accounting: { bg: 'bg-slate-500/15', text: 'text-slate-400' },
  Mechanic: { bg: 'bg-elevated', text: 'text-muted' },
  Other: { bg: 'bg-elevated', text: 'text-muted' },
};

export type CategoryDisplayContext = {
  colorMap?: Map<string, string>;
  nameMap?: Map<string, string>;
};

export function isTransactionCategory(value: string): value is TransactionCategory {
  return isBuiltInCategory(value);
}

export function getCategoryIcon(category: string): LucideIcon {
  if (isTransactionCategory(category)) {
    return CATEGORY_ICONS[category];
  }

  return CircleEllipsis;
}

export function getCategoryColor(category: string, context?: CategoryDisplayContext): string {
  if (category === FIXED_COSTS_CATEGORY) {
    return FIXED_COSTS_CHART_COLOR;
  }

  if (context?.colorMap?.has(category)) {
    return context.colorMap.get(category)!;
  }

  if (isTransactionCategory(category)) {
    return CATEGORY_CHART_COLORS[category];
  }

  return '#9ca3af';
}

export function getCategoryLabelKey(category: string, context?: CategoryDisplayContext): string {
  if (category === FIXED_COSTS_CATEGORY) {
    return FIXED_COSTS_I18N_KEY;
  }

  if (context?.nameMap?.has(category)) {
    const name = context.nameMap.get(category)!;
    if (isCustomCategoryKey(category)) {
      return name;
    }
  }

  if (isTransactionCategory(category)) {
    return CATEGORY_I18N_KEYS[category];
  }

  return category;
}

export function resolveCategoryLabel(
  category: string,
  t: (key: string) => string,
  context?: CategoryDisplayContext
): string {
  const labelKey = getCategoryLabelKey(category, context);

  if (isCustomCategoryKey(category)) {
    return labelKey;
  }

  return t(labelKey);
}

export function getCategoryIconStyles(category: string): { bg: string; text: string } {
  if (isTransactionCategory(category)) {
    return CATEGORY_ICON_STYLES[category];
  }

  return CATEGORY_ICON_STYLES.Other;
}
