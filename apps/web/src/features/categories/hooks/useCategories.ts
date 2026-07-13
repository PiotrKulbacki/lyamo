'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { translateError } from '@shared/features/i18n';
import type { CategoryListItem } from '@shared/features/transactions/category-schemas';
import { useLocale } from '@web/features/i18n/LocaleProvider';
import { getCategoryLabelKey } from '@web/features/transactions/lib/category-config';

export function useCategories() {
  const { locale } = useLocale();
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      const data = (await response.json()) as {
        categories?: CategoryListItem[];
        error?: string;
      };

      if (!response.ok) {
        toast.error(translateError(data.error ?? 'auth.errors.generic', locale));
        return;
      }

      setCategories(data.categories ?? []);
    } catch {
      toast.error(translateError('auth.errors.networkError', locale));
    } finally {
      setIsLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const colorMap = useMemo(
    () => new Map(categories.map((category) => [category.key, category.color])),
    [categories]
  );

  const nameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categories) {
      map.set(category.key, category.isCustom ? category.name : category.key);
    }
    return map;
  }, [categories]);

  return {
    categories,
    colorMap,
    nameMap,
    isLoading,
    reload: loadCategories,
  };
}

export function getCategoryOptionLabel(
  category: CategoryListItem,
  t: (key: string) => string
): string {
  if (category.isCustom) {
    return category.name;
  }

  return t(getCategoryLabelKey(category.key));
}
