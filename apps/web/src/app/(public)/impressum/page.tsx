'use client';

import Link from 'next/link';
import { LegalPageShell } from '@web/features/legal/components/LegalPageShell';
import { LegalField } from '@web/features/legal/components/LegalField';
import { useT } from '@web/features/i18n/LocaleProvider';
import { CONTACT_FORM_HREF, OPERATOR, OPERATOR_ADDRESS_LINE, UST_IDNR } from '@web/lib/legal';

export default function ImpressumPage() {
  const t = useT();

  return (
    <LegalPageShell title={t('legal.impressum.title')}>
      <section>
        <p className="mb-8">{t('legal.impressum.intro', { productName: OPERATOR.productName })}</p>
        <h2 className="font-display text-(--text) mb-4 text-xl font-semibold">
          {t('legal.impressum.provider.title')}
        </h2>
        <dl className="space-y-3">
          <LegalField label={t('legal.impressum.provider.labels.legalName')}>
            {OPERATOR.legalName}
          </LegalField>
          <LegalField label={t('legal.impressum.provider.labels.product')}>
            {OPERATOR.productName}
          </LegalField>
          <LegalField label={t('legal.impressum.provider.labels.address')}>
            {OPERATOR_ADDRESS_LINE}, {t('legal.impressum.provider.country')}
          </LegalField>
          <LegalField label={t('legal.impressum.provider.labels.email')}>
            <a href={`mailto:${OPERATOR.email}`} className="text-warm hover:underline">
              {OPERATOR.email}
            </a>
          </LegalField>
          <LegalField label={t('legal.impressum.provider.labels.contactForm')}>
            <Link href={CONTACT_FORM_HREF} className="text-warm hover:underline">
              {t('legal.impressum.provider.contactFormLink')}
            </Link>
          </LegalField>
          {UST_IDNR ? (
            <LegalField label={t('legal.impressum.provider.labels.vatId')}>{UST_IDNR}</LegalField>
          ) : null}
        </dl>
        <p className="mt-4">{t('legal.impressum.provider.legalForm')}</p>
      </section>
    </LegalPageShell>
  );
}
