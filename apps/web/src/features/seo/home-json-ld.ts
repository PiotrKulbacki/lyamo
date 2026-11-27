import type { PaidPlanType } from '@shared/features/billing';
import { BILLING_CURRENCIES, DEFAULT_BILLING_CURRENCY } from '@shared/features/billing/checkout';
import { getPlanRegularPrice } from '@shared/features/billing/pricing';
import { t, type Locale } from '@shared/features/i18n';
import { OPERATOR, OWNER_STRUCTURED_DATA as OWNER, UST_IDNR } from '@web/lib/legal';

const PAID_PLANS: { plan: PaidPlanType; name: string }[] = [
  { plan: 'PRO', name: 'Pro' },
  { plan: 'PREMIUM', name: 'Premium' },
];

/**
 * One Offer per plan (seo-encje.md, 13.2). Google requires `offers.price`, so each Offer
 * carries the price in the currency the pricing section shows first; the monthly
 * subscription price in every selectable currency is in `priceSpecification`. Regular
 * prices only: the promo code discount is not available to everyone.
 */
function planOffers() {
  const free = {
    '@type': 'Offer',
    name: 'Free',
    price: 0,
    priceCurrency: DEFAULT_BILLING_CURRENCY,
  };
  const paid = PAID_PLANS.map(({ plan, name }) => ({
    '@type': 'Offer',
    name,
    price: getPlanRegularPrice(plan, DEFAULT_BILLING_CURRENCY),
    priceCurrency: DEFAULT_BILLING_CURRENCY,
    priceSpecification: BILLING_CURRENCIES.map((currency) => ({
      '@type': 'UnitPriceSpecification',
      price: getPlanRegularPrice(plan, currency),
      priceCurrency: currency,
      billingDuration: 'P1M',
    })),
  }));
  return [free, ...paid];
}

/**
 * Home page graph per template 5.3 of the shared standard
 * (~/Developer/ebook-shop/docs/seo-encje.md): brand, app, website. The person is only
 * referenced; the full node lives on piotrkulbacki.com. No street address in structured
 * data (owner decision 10 in the standard); the full address is in the Impressum.
 */
export function buildHomeJsonLd(locale: Locale) {
  const brandRef = { '@id': OWNER.brandId };
  const description = t('seo.home.description', locale);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'OnlineBusiness',
        ...brandRef,
        name: OPERATOR.productName,
        legalName: OPERATOR.legalName,
        url: OWNER.siteUrl,
        logo: `${OWNER.siteUrl}lyamo-mark.png`,
        description,
        email: OPERATOR.email,
        ...(UST_IDNR ? { vatID: UST_IDNR } : {}),
        address: {
          '@type': 'PostalAddress',
          postalCode: OPERATOR.postalCode,
          addressLocality: OPERATOR.city,
          addressCountry: OPERATOR.countryCode,
        },
        founder: {
          '@type': 'Person',
          '@id': OWNER.person.id,
          name: OWNER.person.name,
          url: OWNER.person.url,
        },
      },
      {
        '@type': 'WebApplication',
        '@id': OWNER.appId,
        name: OPERATOR.productName,
        url: OWNER.siteUrl,
        description,
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        inLanguage: locale,
        offers: planOffers(),
        author: { '@id': OWNER.person.id },
        publisher: brandRef,
      },
      {
        '@type': 'WebSite',
        '@id': OWNER.websiteId,
        name: OPERATOR.productName,
        url: OWNER.siteUrl,
        inLanguage: locale,
        publisher: brandRef,
      },
    ],
  };
}

/** JSON for an inline `<script>`; escaping `<` prevents closing the tag early. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
