'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_LOCALE, isLocale, t as translate, type Locale } from '@shared/features/i18n';

const LOCALE_COOKIE = 'sec_locale';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readLocaleCookie(): Locale {
  if (typeof document === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  const value = match?.[1];

  if (value && isLocale(value)) {
    return value;
  }

  return DEFAULT_LOCALE;
}

function writeLocaleCookie(locale: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;samesite=lax`;
}

export function LocaleProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    // #region agent log
    const cookieLocale = readLocaleCookie();
    fetch('http://127.0.0.1:7528/ingest/e3c1f8a3-0097-405d-aadf-389a4a28577c', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'ecd1ac' },
      body: JSON.stringify({
        sessionId: 'ecd1ac',
        runId: 'hydration-fix',
        hypothesisId: 'H7',
        location: 'LocaleProvider.tsx:mount',
        message: 'Locale hydration check',
        data: {
          initialLocale,
          stateLocale: locale,
          cookieLocale,
          mismatch: cookieLocale !== initialLocale,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [initialLocale, locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    writeLocaleCookie(nextLocale);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(key, locale, params),
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
}

export function useT(): LocaleContextValue['t'] {
  return useLocale().t;
}
