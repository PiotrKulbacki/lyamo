import { describe, expect, it } from 'vitest';
import { t } from '@shared/features/i18n';
import { buildHomeJsonLd, serializeJsonLd } from './home-json-ld';

describe('buildHomeJsonLd', () => {
  it('links product, owner and website through stable @id values', () => {
    const [product, person, website] = buildHomeJsonLd('de')['@graph'];

    expect(product).toMatchObject({
      '@type': 'WebApplication',
      '@id': 'https://lyamo.eu/#lyamo',
      applicationCategory: 'FinanceApplication',
      description: t('seo.home.description', 'de'),
      author: { '@id': 'https://cavunio.com/#piotr-kulbacki' },
      publisher: { '@id': 'https://cavunio.com/#piotr-kulbacki' },
    });
    expect(person).toMatchObject({
      '@type': 'Person',
      '@id': 'https://cavunio.com/#piotr-kulbacki',
      name: 'Piotr Kulbacki',
      url: 'https://piotrkulbacki.com',
      brand: [
        { '@id': 'https://lyamo.eu/#lyamo' },
        {
          '@type': 'Brand',
          '@id': 'https://cavunio.com/#cavunio',
          name: 'Cavunio',
          url: 'https://cavunio.com',
        },
        {
          '@type': 'Brand',
          '@id': 'https://dokiero.com/#dokiero',
          name: 'Dokiero',
          url: 'https://dokiero.com',
        },
      ],
    });
    expect(website).toMatchObject({
      '@type': 'WebSite',
      '@id': 'https://lyamo.eu/#website',
      name: 'Lyamo',
      url: 'https://lyamo.eu/',
      inLanguage: 'de',
      publisher: { '@id': 'https://cavunio.com/#piotr-kulbacki' },
    });
  });
});

describe('serializeJsonLd', () => {
  it('cannot close the surrounding script tag', () => {
    const json = serializeJsonLd({ text: '</script><script>alert(1)</script>' });

    expect(json).not.toContain('<');
    expect(JSON.parse(json)).toEqual({ text: '</script><script>alert(1)</script>' });
  });
});
