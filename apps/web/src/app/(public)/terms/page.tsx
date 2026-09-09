'use client';

import Link from 'next/link';
import { LegalPageShell } from '@web/features/legal/components/LegalPageShell';
import { LegalSection } from '@web/features/legal/components/LegalSection';
import { useT } from '@web/features/i18n/LocaleProvider';
import {
  IMPRESSUM_HREF,
  OPERATOR,
  OPERATOR_ADDRESS_LINE,
  PRIVACY_HREF,
  UST_IDNR,
} from '@web/lib/legal';

export default function TermsPage() {
  const t = useT();
  const operatorParams = {
    legalName: OPERATOR.legalName,
    productName: OPERATOR.productName,
    address: OPERATOR_ADDRESS_LINE,
    email: OPERATOR.email,
  };

  return (
    <LegalPageShell title={t('legal.terms.title')}>
      <LegalSection
        title={t('legal.terms.sections.general.title')}
        paragraphs={[
          <>
            {t('legal.terms.sections.general.p1', operatorParams)}{' '}
            <Link href={IMPRESSUM_HREF} className="text-warm hover:underline">
              {`${t('legal.terms.sections.general.impressumLink')}.`}
            </Link>
          </>,
          t('legal.terms.sections.general.p2'),
        ]}
      />
      <LegalSection
        title={t('legal.terms.sections.scope.title')}
        paragraphs={[t('legal.terms.sections.scope.p1')]}
        list={[
          t('legal.terms.sections.scope.list.item1'),
          t('legal.terms.sections.scope.list.item2'),
          t('legal.terms.sections.scope.list.item3'),
        ]}
      />
      <LegalSection
        title={t('legal.terms.sections.subscription.title')}
        paragraphs={[t('legal.terms.sections.subscription.p1')]}
      />
      <LegalSection title={t('legal.terms.sections.vat.title')}>
        <p className="mb-4">{t('legal.terms.sections.vat.p1')}</p>
        {UST_IDNR ? (
          <p>
            {t('legal.terms.sections.vat.vatNote', { vatId: UST_IDNR })}{' '}
            <Link href={IMPRESSUM_HREF} className="text-warm hover:underline">
              {`${t('legal.terms.sections.vat.impressumLink')}.`}
            </Link>
          </p>
        ) : null}
      </LegalSection>
      <LegalSection
        title={t('legal.terms.sections.withdrawal.title')}
        paragraphs={[t('legal.terms.sections.withdrawal.p1')]}
      />
      <LegalSection
        title={t('legal.terms.sections.refund.title')}
        paragraphs={[t('legal.terms.sections.refund.p1'), t('legal.terms.sections.refund.p2')]}
      />
      <LegalSection
        title={t('legal.terms.sections.ai.title')}
        paragraphs={[t('legal.terms.sections.ai.intro')]}
        list={[
          t('legal.terms.sections.ai.list.item1'),
          t('legal.terms.sections.ai.list.item2'),
          t('legal.terms.sections.ai.list.item3'),
          t('legal.terms.sections.ai.list.item4'),
        ]}
      />
      <LegalSection
        title={t('legal.terms.sections.cancellation.title')}
        paragraphs={[t('legal.terms.sections.cancellation.p1')]}
      />
      <LegalSection
        title={t('legal.terms.sections.inactive.title')}
        paragraphs={[t('legal.terms.sections.inactive.p1')]}
      />
      <LegalSection
        title={t('legal.terms.sections.complaints.title')}
        paragraphs={[t('legal.terms.sections.complaints.intro', { email: OPERATOR.email })]}
        list={[
          t('legal.terms.sections.complaints.list.item1', { email: OPERATOR.email }),
          t('legal.terms.sections.complaints.list.item2'),
          t('legal.terms.sections.complaints.list.item3'),
        ]}
      />
      <LegalSection
        title={t('legal.terms.sections.privacy.title')}
        paragraphs={[
          <>
            {t('legal.terms.sections.privacy.p1')}{' '}
            <Link href={PRIVACY_HREF} className="text-warm hover:underline">
              {`${t('legal.terms.sections.privacy.privacyLink')}.`}
            </Link>
          </>,
        ]}
      />
      <LegalSection
        title={t('legal.terms.sections.disputes.title')}
        paragraphs={[t('legal.terms.sections.disputes.p1')]}
      />
    </LegalPageShell>
  );
}
