'use client';

import Link from 'next/link';
import { useT } from '@web/features/i18n/LocaleProvider';
import { useCookieConsent } from '@web/features/cookie-consent';
import { LyamoLogo } from '@web/features/layout/components/LyamoLogo';
import { OWNER_STRUCTURED_DATA } from '@web/lib/legal';

export function PublicFooter() {
  const t = useT();
  const { openPreferences } = useCookieConsent();

  return (
    <footer className="bg-surface/50 border-t border-[var(--border)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-3">
          <Link href="/" className="inline-flex w-fit">
            <LyamoLogo markClassName="h-8 w-8" />
          </Link>
          <p className="text-muted text-sm">
            {t('layout.footer.copyright', { year: new Date().getFullYear() })}
          </p>
          {/* Visible founder: the JSON-LD names the founder (seo-encje.md, rule 4 and section 7). */}
          <p className="text-muted text-sm">
            {t('layout.footer.founder')}:{' '}
            <a
              href={OWNER_STRUCTURED_DATA.person.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-warm transition"
            >
              {OWNER_STRUCTURED_DATA.person.name}
            </a>
          </p>
        </div>

        <nav aria-labelledby="footer-products" className="flex flex-col gap-2">
          <p
            id="footer-products"
            className="text-muted font-mono text-xs uppercase tracking-widest"
          >
            {t('layout.footer.myProducts')}
          </p>
          <ul className="text-muted flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {OWNER_STRUCTURED_DATA.otherBrands.map(({ name, url }) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-warm transition"
                >
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="text-muted flex flex-wrap gap-x-5 gap-y-2 text-sm lg:max-w-md lg:justify-end">
          <Link href="/terms" className="hover:text-warm transition">
            {t('layout.footer.terms')}
          </Link>
          <Link href="/privacy" className="hover:text-warm transition">
            {t('layout.footer.privacy')}
          </Link>
          <Link href="/impressum" className="hover:text-warm transition">
            {t('layout.footer.impressum')}
          </Link>
          <button type="button" onClick={openPreferences} className="hover:text-warm transition">
            {t('layout.footer.cookieSettings')}
          </button>
          <Link href="/contact" className="hover:text-warm transition">
            {t('layout.footer.contact')}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
