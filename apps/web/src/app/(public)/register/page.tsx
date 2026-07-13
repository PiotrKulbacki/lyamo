'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { isBillingCurrency } from '@shared/features/billing';
import { AuthForm } from '@web/features/auth/components/AuthForm';
import { writeStoredBillingCurrency } from '@web/features/billing/components/BillingCurrencySwitcher';
import { useT } from '@web/features/i18n/LocaleProvider';

function RegisterCurrencySync() {
  const searchParams = useSearchParams();
  const currency = searchParams.get('currency');

  useEffect(() => {
    if (currency && isBillingCurrency(currency)) {
      writeStoredBillingCurrency(currency);
    }
  }, [currency]);

  return null;
}

export default function RegisterPage() {
  const t = useT();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-16">
      <Suspense fallback={null}>
        <RegisterCurrencySync />
      </Suspense>
      <div className="w-full space-y-6">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-[var(--text)]">
            {t('auth.labels.register')}
          </h1>
          <p className="mt-2 text-sm text-muted">{t('auth.labels.signUp')}</p>
        </div>
        <Suspense fallback={null}>
          <AuthForm mode="register" />
        </Suspense>
        <p className="text-center text-sm text-muted">
          {t('auth.labels.hasAccount')}{' '}
          <Link href="/login" className="font-medium text-cool hover:text-warm">
            {t('auth.labels.signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
