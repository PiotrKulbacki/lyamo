/** Public operator facts for Impressum, AGB, and the privacy policy. */
export const OPERATOR = {
  legalName: 'Piotr Kulbacki',
  productName: 'Lyamo',
  street: 'Bendastr. 11',
  postalCode: '12051',
  city: 'Berlin',
  email: 'kontakt@lyamo.eu',
  website: 'https://piotrkulbacki.com',
} as const;

/**
 * Owner identity for JSON-LD. The owner (sole proprietorship) is presented by
 * piotrkulbacki.com and owns every brand below. The `@id` values are shared with
 * the owner's other sites (piotrkulbacki.com, cavunio.com, dokiero.com) and must stay
 * byte-identical, as must the person's `name`, `url` and `sameAs` (same order).
 * Site URLs are written without a trailing slash, as on the owner's other sites.
 */
export const OWNER_STRUCTURED_DATA = {
  siteUrl: 'https://lyamo.eu',
  brandId: 'https://lyamo.eu/#lyamo',
  appId: 'https://lyamo.eu/#app',
  websiteId: 'https://lyamo.eu/#website',
  person: {
    id: 'https://cavunio.com/#piotr-kulbacki',
    name: OPERATOR.legalName,
    url: OPERATOR.website,
    sameAs: [
      'https://www.linkedin.com/in/it-piotr-kulbacki',
      'https://www.facebook.com/profile.php?id=61568507043528',
      'https://github.com/PiotrKulbacki',
      'https://www.instagram.com/piotr.kulbacki/',
      'https://www.tiktok.com/@piotr_kulbacki_youtube',
      'https://www.youtube.com/@kulbackipiotr',
    ],
  },
  otherBrands: [
    { id: 'https://cavunio.com/#cavunio', name: 'Cavunio', url: 'https://cavunio.com' },
    { id: 'https://dokiero.com/#dokiero', name: 'Dokiero', url: 'https://dokiero.com' },
  ],
} as const;

/** German VAT ID - public by law once issued. Set NEXT_PUBLIC_UST_IDNR. */
export const UST_IDNR = process.env.NEXT_PUBLIC_UST_IDNR?.trim() ?? '';

export const OPERATOR_ADDRESS_LINE = `${OPERATOR.street}, ${OPERATOR.postalCode} ${OPERATOR.city}`;

export const SUPERVISORY_AUTHORITY = {
  name: 'Berliner Beauftragte für Datenschutz und Informationsfreiheit',
  address: 'Alt-Moabit 59-61, 10555 Berlin',
  url: 'https://www.datenschutz-berlin.de/',
} as const;

export const CONTACT_FORM_HREF = '/contact' as const;
export const IMPRESSUM_HREF = '/impressum' as const;
export const PRIVACY_HREF = '/privacy' as const;
export const TERMS_HREF = '/terms' as const;
