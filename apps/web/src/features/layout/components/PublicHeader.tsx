'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from '@web/components/ui/sheet';
import { useT } from '@web/features/i18n/LocaleProvider';
import { LocaleSwitcher } from '@web/features/layout/components/LocaleSwitcher';
import { LyamoLogo } from '@web/features/layout/components/LyamoLogo';

export function PublicHeader() {
  const t = useT();
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  return (
    <header className="panel-cut bg-void/90 sticky top-0 z-40 border-b border-[var(--border)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="group inline-flex">
          <LyamoLogo markClassName="h-9 w-9" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <a href="/#features" className="nav-link">
            {t('layout.nav.features')}
          </a>
          <a href="/#pricing" className="nav-link">
            {t('layout.nav.pricing')}
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <Link href="/login" className="btn-ghost hidden px-3 py-2 md:inline-flex">
            {t('auth.labels.login')}
          </Link>
          <Link href="/register" className="btn-primary hidden px-3 py-2 md:inline-flex">
            {t('auth.labels.register')}
          </Link>

          <button
            type="button"
            className="text-muted hover:bg-elevated/50 inline-flex items-center justify-center rounded-lg border border-[var(--border)] p-2 transition hover:text-[var(--text)] md:hidden"
            aria-label={t('layout.aria.openMenu')}
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="max-w-xs md:hidden">
          <SheetHeader className="pr-12">
            <SheetTitle>{t('layout.brand')}</SheetTitle>
          </SheetHeader>
          <SheetBody className="flex flex-col gap-6">
            <nav className="flex flex-col gap-1">
              <a
                href="/#features"
                className="text-muted hover:bg-elevated/50 rounded-lg px-3 py-2.5 font-mono text-sm transition hover:text-[var(--text)]"
                onClick={closeMobileMenu}
              >
                {t('layout.nav.features')}
              </a>
              <a
                href="/#pricing"
                className="text-muted hover:bg-elevated/50 rounded-lg px-3 py-2.5 font-mono text-sm transition hover:text-[var(--text)]"
                onClick={closeMobileMenu}
              >
                {t('layout.nav.pricing')}
              </a>
            </nav>

            <div className="border-t border-[var(--border)] pt-6">
              <div className="flex flex-col gap-3">
                <Link
                  href="/login"
                  className="btn-ghost w-full justify-center"
                  onClick={closeMobileMenu}
                >
                  {t('auth.labels.login')}
                </Link>
                <Link
                  href="/register"
                  className="btn-primary w-full justify-center"
                  onClick={closeMobileMenu}
                >
                  {t('auth.labels.register')}
                </Link>
              </div>
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>
    </header>
  );
}
