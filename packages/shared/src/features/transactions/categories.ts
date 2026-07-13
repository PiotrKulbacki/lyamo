export const CUSTOM_CATEGORY_PREFIX = 'custom:';

export const TRANSACTION_CATEGORIES = [
  'Groceries',
  'Transport',
  'CoffeeShop',
  'Restaurants',
  'Entertainment',
  'Health',
  'Fuel',
  'Household',
  'Cosmetics',
  'Hotels',
  'Alcohol',
  'Accounting',
  'Mechanic',
  'Other',
] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export const LEGACY_CATEGORY_MIGRATIONS: Record<string, TransactionCategory> = {
  Coffee: 'CoffeeShop',
  Shopping: 'Other',
  Utilities: 'Other',
};

export function normalizeLegacyCategory(value: string): string {
  return LEGACY_CATEGORY_MIGRATIONS[value] ?? value;
}

export function isBuiltInCategory(value: string): value is TransactionCategory {
  return (TRANSACTION_CATEGORIES as readonly string[]).includes(value);
}

export function isCustomCategoryKey(value: string): boolean {
  return value.startsWith(CUSTOM_CATEGORY_PREFIX);
}

export function buildCustomCategoryKey(id: string): string {
  return `${CUSTOM_CATEGORY_PREFIX}${id}`;
}

export function parseCustomCategoryId(value: string): string | null {
  if (!isCustomCategoryKey(value)) {
    return null;
  }

  return value.slice(CUSTOM_CATEGORY_PREFIX.length);
}
