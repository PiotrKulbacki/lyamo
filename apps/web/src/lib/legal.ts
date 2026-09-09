/** Public operator facts for Impressum, AGB, and the privacy policy. */
export const OPERATOR = {
  legalName: 'Piotr Kulbacki',
  productName: 'Lyamo',
  street: 'Bendastr. 11',
  postalCode: '12051',
  city: 'Berlin',
  email: 'kontakt@lyamo.eu',
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
