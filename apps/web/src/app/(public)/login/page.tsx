'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { AuthForm } from '@web/features/auth/components/AuthForm';
import { useT } from '@web/features/i18n/LocaleProvider';

export default function LoginPage() {
  const t = useT();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-16">
      <div className="w-full space-y-6">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-[var(--text)]">
            {t('auth.labels.login')}
          </h1>
          <p className="mt-2 text-sm text-muted">{t('auth.labels.signIn')}</p>
        </div>
        <Suspense fallback={null}>
          <AuthForm mode="login" />
        </Suspense>
        <p className="text-center text-sm text-muted">
          {t('auth.labels.noAccount')}{' '}
          <Link href="/register" className="font-medium text-cool hover:text-warm">
            {t('auth.labels.signUp')}
          </Link>
        </p>
      </div>
    </div>
  );
}
