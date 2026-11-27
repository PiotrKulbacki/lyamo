/** Public operator facts for Impressum, AGB, and the privacy policy. */
export const OPERATOR = {
  legalName: 'Piotr Kulbacki',
  productName: 'Lyamo',
  street: 'Bendastr. 11',
  postalCode: '12051',
  city: 'Berlin',
  email: 'kontakt@lyamo.eu',
  countryCode: 'DE',
  website: 'https://piotrkulbacki.com/',
} as const;

/**
 * Identity for JSON-LD, per the shared standard for the owner's four sites
 * (~/Developer/ebook-shop/docs/seo-encje.md, sections 1.1 and 3): `@id` values and the
 * person's `name` and `url` must stay byte-identical on every site. Home page and entity
 * `url` values end with a slash; subpage URLs do not (same as their canonical).
 * The person's entity home is piotrkulbacki.com; this site only references it.
 */
export const OWNER_STRUCTURED_DATA = {
  siteUrl: 'https://lyamo.eu/',
  brandId: 'https://lyamo.eu/#lyamo',
  appId: 'https://lyamo.eu/#app',
  websiteId: 'https://lyamo.eu/#website',
  person: {
    id: 'https://piotrkulbacki.com/#person',
    name: OPERATOR.legalName,
    url: OPERATOR.website,
  },
  /** The owner's other brands, linked in the footer and in llms.txt. */
  otherBrands: [
    { name: 'Cavunio', url: 'https://cavunio.com/' },
    { name: 'Dokiero', url: 'https://dokiero.com/' },
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
