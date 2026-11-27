import { describe, expect, it, vi } from 'vitest';
import { t } from '@shared/features/i18n';

const legal = vi.hoisted(() => ({ ustIdnr: 'DE123456789' }));

vi.mock('@web/lib/legal', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@web/lib/legal')>();
  return {
    ...actual,
    get UST_IDNR() {
      return legal.ustIdnr;
    },
  };
});

import { buildHomeJsonLd, serializeJsonLd } from './home-json-ld';

const PERSON_ID = 'https://piotrkulbacki.com/#person';

describe('buildHomeJsonLd', () => {
  it('follows template 5.3: brand, app and website linked by stable @id values', () => {
    const graph = buildHomeJsonLd('de')['@graph'];
    const [brand, app, website] = graph;

    expect(graph).toHaveLength(3);
    expect(brand).toEqual({
      '@type': 'OnlineBusiness',
      '@id': 'https://lyamo.eu/#lyamo',
      name: 'Lyamo',
      legalName: 'Piotr Kulbacki',
      url: 'https://lyamo.eu/',
      logo: 'https://lyamo.eu/lyamo-mark.png',
      description: t('seo.home.description', 'de'),
      email: 'kontakt@lyamo.eu',
      vatID: 'DE123456789',
      address: {
        '@type': 'PostalAddress',
        postalCode: '12051',
        addressLocality: 'Berlin',
        addressCountry: 'DE',
      },
      founder: {
        '@type': 'Person',
        '@id': PERSON_ID,
        name: 'Piotr Kulbacki',
        url: 'https://piotrkulbacki.com/',
      },
    });
    expect(app).toMatchObject({
      '@type': 'WebApplication',
      '@id': 'https://lyamo.eu/#app',
      name: 'Lyamo',
      url: 'https://lyamo.eu/',
      applicationCategory: 'FinanceApplication',
      author: { '@id': PERSON_ID },
      publisher: { '@id': 'https://lyamo.eu/#lyamo' },
    });
    expect(website).toEqual({
      '@type': 'WebSite',
      '@id': 'https://lyamo.eu/#website',
      name: 'Lyamo',
      url: 'https://lyamo.eu/',
      inLanguage: 'de',
      publisher: { '@id': 'https://lyamo.eu/#lyamo' },
    });
  });

  it('lists one monthly offer per plan at the regular price in every currency', () => {
    const [, app] = buildHomeJsonLd('en')['@graph'];
    const offers = (app as { offers: Record<string, unknown>[] }).offers;

    expect(offers.map((offer) => offer.name)).toEqual(['Free', 'Pro', 'Premium']);
    expect(offers[0]).toEqual({ '@type': 'Offer', name: 'Free', price: 0, priceCurrency: 'PLN' });
    expect(offers[1]).toEqual({
      '@type': 'Offer',
      name: 'Pro',
      price: 34,
      priceCurrency: 'PLN',
      priceSpecification: [
        {
          '@type': 'UnitPriceSpecification',
          price: 34,
          priceCurrency: 'PLN',
          billingDuration: 'P1M',
        },
        {
          '@type': 'UnitPriceSpecification',
          price: 8,
          priceCurrency: 'EUR',
          billingDuration: 'P1M',
        },
        {
          '@type': 'UnitPriceSpecification',
          price: 6.5,
          priceCurrency: 'GBP',
          billingDuration: 'P1M',
        },
        {
          '@type': 'UnitPriceSpecification',
          price: 9,
          priceCurrency: 'USD',
          billingDuration: 'P1M',
        },
      ],
    });
    expect(offers[2]).toMatchObject({ name: 'Premium', price: 46, priceCurrency: 'PLN' });
  });

  it('omits vatID when no VAT ID is configured', () => {
    legal.ustIdnr = '';
    const [brand] = buildHomeJsonLd('en')['@graph'];
    legal.ustIdnr = 'DE123456789';

    expect(brand).not.toHaveProperty('vatID');
  });

  it('only references the person and never uses the retired @id', () => {
    const json = JSON.stringify(buildHomeJsonLd('pl'));

    expect(json).not.toContain('cavunio.com/#piotr-kulbacki');
    expect(json).not.toContain('"sameAs"');
    expect(json).not.toContain('"brand"');
  });
});

describe('serializeJsonLd', () => {
  it('cannot close the surrounding script tag', () => {
    const json = serializeJsonLd({ text: '</script><script>alert(1)</script>' });

    expect(json).not.toContain('<');
    expect(JSON.parse(json)).toEqual({ text: '</script><script>alert(1)</script>' });
  });
});
