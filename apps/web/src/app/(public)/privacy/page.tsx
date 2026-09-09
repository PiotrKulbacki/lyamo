'use client';

import Link from 'next/link';
import { LegalPageShell } from '@web/features/legal/components/LegalPageShell';
import { LegalSection } from '@web/features/legal/components/LegalSection';
import { useCookieConsent } from '@web/features/cookie-consent';
import { useT } from '@web/features/i18n/LocaleProvider';
import {
  IMPRESSUM_HREF,
  OPERATOR,
  OPERATOR_ADDRESS_LINE,
  SUPERVISORY_AUTHORITY,
} from '@web/lib/legal';

export default function PrivacyPage() {
  const t = useT();
  const { openPreferences } = useCookieConsent();
  const operatorParams = {
    legalName: OPERATOR.legalName,
    productName: OPERATOR.productName,
    address: OPERATOR_ADDRESS_LINE,
    email: OPERATOR.email,
  };

  return (
    <LegalPageShell title={t('legal.privacy.title')}>
      <LegalSection
        title={t('legal.privacy.sections.controller.title')}
        paragraphs={[
          t('legal.privacy.sections.controller.p1', operatorParams),
          <>
            {t('legal.privacy.sections.controller.p2')}{' '}
            <Link href={IMPRESSUM_HREF} className="text-warm hover:underline">
              {`${t('legal.privacy.sections.controller.impressumLink')}.`}
            </Link>
          </>,
        ]}
      />
      <LegalSection
        title={t('legal.privacy.sections.purposes.title')}
        paragraphs={[t('legal.privacy.sections.purposes.intro')]}
        list={[
          t('legal.privacy.sections.purposes.list.item1'),
          t('legal.privacy.sections.purposes.list.item2'),
          t('legal.privacy.sections.purposes.list.item3'),
          t('legal.privacy.sections.purposes.list.item4'),
          t('legal.privacy.sections.purposes.list.item5'),
          t('legal.privacy.sections.purposes.list.item6'),
          t('legal.privacy.sections.purposes.list.item7'),
        ]}
      />
      <LegalSection
        title={t('legal.privacy.sections.specialCategories.title')}
        paragraphs={[t('legal.privacy.sections.specialCategories.p1')]}
      />
      <LegalSection
        title={t('legal.privacy.sections.retention.title')}
        paragraphs={[t('legal.privacy.sections.retention.intro')]}
        list={[
          t('legal.privacy.sections.retention.list.item1'),
          t('legal.privacy.sections.retention.list.item2'),
          t('legal.privacy.sections.retention.list.item3'),
          t('legal.privacy.sections.retention.list.item4'),
          t('legal.privacy.sections.retention.list.item5'),
          t('legal.privacy.sections.retention.list.item6'),
        ]}
      />
      <LegalSection
        title={t('legal.privacy.sections.recipients.title')}
        paragraphs={[t('legal.privacy.sections.recipients.intro')]}
        list={[
          t('legal.privacy.sections.recipients.list.item1'),
          t('legal.privacy.sections.recipients.list.item2'),
          t('legal.privacy.sections.recipients.list.item3'),
          t('legal.privacy.sections.recipients.list.item4'),
          t('legal.privacy.sections.recipients.list.item5'),
          t('legal.privacy.sections.recipients.list.item6'),
          t('legal.privacy.sections.recipients.list.item7'),
          t('legal.privacy.sections.recipients.list.item8'),
          t('legal.privacy.sections.recipients.list.item9'),
        ]}
      />
      <LegalSection
        title={t('legal.privacy.sections.transfers.title')}
        paragraphs={[t('legal.privacy.sections.transfers.p1')]}
      />
      <LegalSection
        title={t('legal.privacy.sections.rights.title')}
        paragraphs={[t('legal.privacy.sections.rights.intro')]}
        list={[
          t('legal.privacy.sections.rights.list.item1'),
          t('legal.privacy.sections.rights.list.item2'),
          t('legal.privacy.sections.rights.list.item3'),
          t('legal.privacy.sections.rights.list.item4'),
          t('legal.privacy.sections.rights.list.item5'),
          t('legal.privacy.sections.rights.list.item6'),
          t('legal.privacy.sections.rights.list.item7'),
          t('legal.privacy.sections.rights.list.item8'),
        ]}
      />
      <LegalSection
        title={t('legal.privacy.sections.google.title')}
        paragraphs={[t('legal.privacy.sections.google.p1')]}
      />
      <LegalSection
        title={t('legal.privacy.sections.cookies.title')}
        paragraphs={[t('legal.privacy.sections.cookies.intro')]}
        list={[
          t('legal.privacy.sections.cookies.list.necessary'),
          t('legal.privacy.sections.cookies.list.analytics'),
          t('legal.privacy.sections.cookies.list.marketing'),
        ]}
      >
        <p className="mb-4">{t('legal.privacy.sections.cookies.tableIntro')}</p>
        <ul className="mb-4 ml-5 list-disc space-y-2">
          <li>{t('legal.privacy.sections.cookies.table.session')}</li>
          <li>{t('legal.privacy.sections.cookies.table.locale')}</li>
          <li>{t('legal.privacy.sections.cookies.table.consent')}</li>
          <li>{t('legal.privacy.sections.cookies.table.posthog')}</li>
          <li>{t('legal.privacy.sections.cookies.table.vercel')}</li>
        </ul>
        <p className="mb-4">{t('legal.privacy.sections.cookies.outro')}</p>
        <button
          type="button"
          onClick={openPreferences}
          className="text-warm cursor-pointer hover:underline"
        >
          {t('legal.privacy.sections.cookies.manage')}
        </button>
      </LegalSection>
      <LegalSection
        title={t('legal.privacy.sections.dpo.title')}
        paragraphs={[
          t('legal.privacy.sections.dpo.p1', { email: OPERATOR.email }),
          <>
            <a
              href={SUPERVISORY_AUTHORITY.url}
              className="text-warm hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {SUPERVISORY_AUTHORITY.name}, {SUPERVISORY_AUTHORITY.address}.
            </a>
          </>,
        ]}
      />
      <LegalSection
        title={t('legal.privacy.sections.security.title')}
        paragraphs={[t('legal.privacy.sections.security.p1')]}
      />
    </LegalPageShell>
  );
}
