import { t, type Locale } from '@shared/features/i18n';
import { OPERATOR, OWNER_STRUCTURED_DATA as OWNER } from '@web/lib/legal';

/** schema.org graph for the home page: brand, app, owner and website. */
export function buildHomeJsonLd(locale: Locale) {
  const brandRef = { '@id': OWNER.brandId };
  const personRef = { '@id': OWNER.person.id };

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Brand',
        ...brandRef,
        name: OPERATOR.productName,
        url: OWNER.siteUrl,
        logo: `${OWNER.siteUrl}/lyamo-mark.png`,
      },
      {
        '@type': 'WebApplication',
        '@id': OWNER.appId,
        name: OPERATOR.productName,
        url: OWNER.siteUrl,
        description: t('seo.home.description', locale),
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        inLanguage: locale,
        author: personRef,
        publisher: personRef,
      },
      {
        '@type': 'Person',
        ...personRef,
        name: OWNER.person.name,
        url: OWNER.person.url,
        sameAs: OWNER.person.sameAs,
        brand: [
          brandRef,
          ...OWNER.otherBrands.map(({ id, name, url }) => ({
            '@type': 'Brand',
            '@id': id,
            name,
            url,
          })),
        ],
      },
      {
        '@type': 'WebSite',
        '@id': OWNER.websiteId,
        name: OPERATOR.productName,
        url: OWNER.siteUrl,
        inLanguage: locale,
        publisher: personRef,
      },
    ],
  };
}

/** JSON for an inline `<script>`; escaping `<` prevents closing the tag early. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
