'use client';

import Link from 'next/link';
import { useT } from '@web/features/i18n/LocaleProvider';

export function PublicFooter() {
  const t = useT();

  return (
    <footer className="border-t border-[var(--border)] bg-surface/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>{t('layout.footer.copyright', { year: new Date().getFullYear() })}</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/terms" className="transition hover:text-warm">
            {t('layout.footer.terms')}
          </Link>
          <Link href="/privacy" className="transition hover:text-warm">
            {t('layout.footer.privacy')}
          </Link>
          <a
            href="mailto:support@smartexpensecontrol.app"
            className="transition hover:text-warm"
          >
            {t('layout.footer.contact')}
          </a>
        </div>
      </div>
    </footer>
  );
}
