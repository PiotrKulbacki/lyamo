import { BILLING_CURRENCIES } from '@shared/features/billing/checkout';
import { formatProSubscriptionPrice, getPlanRegularPrice } from '@shared/features/billing/pricing';
import { SUPPORTED_LOCALES, t } from '@shared/features/i18n';
import { OPERATOR, OWNER_STRUCTURED_DATA as OWNER } from '@web/lib/legal';

const LANGUAGE_NAMES = { en: 'English', de: 'German', pl: 'Polish', es: 'Spanish' } as const;
const FEATURE_KEYS = ['feature1', 'feature2', 'feature3', 'feature4'] as const;

const PLANS = [
  { name: 'Free', key: 'free', plan: null },
  { name: 'Pro', key: 'pro', plan: 'PRO' },
  { name: 'Premium', key: 'premium', plan: 'PREMIUM' },
] as const;

function planLines(): string[] {
  return PLANS.map(({ name, key, plan }) => {
    const price = BILLING_CURRENCIES.map((currency) =>
      formatProSubscriptionPrice(plan ? getPlanRegularPrice(plan, currency) : 0, currency, 'en')
    ).join(' / ');
    const features = FEATURE_KEYS.map((feature) => t(`landing.pricing.${key}.${feature}`, 'en'));
    return `- ${name} (${price} per month): ${features.join('; ')}.`;
  });
}

/**
 * /llms.txt (llmstxt.org): a Markdown summary for AI assistants, same pattern as the
 * owner's shop. It states the same relations as the JSON-LD (seo-encje.md, sections 4
 * and 8.5). `site` is the origin without a trailing slash.
 */
export function buildLlmsTxt(site: string): string {
  const languages = SUPPORTED_LOCALES.map((locale) => LANGUAGE_NAMES[locale]).join(', ');
  const brands = OWNER.otherBrands.map(({ name, url }) => `${name} (${url})`).join(' and ');

  return [
    `# ${OPERATOR.productName}`,
    '',
    `> ${t('seo.home.description', 'en')} Founder and owner: ${OWNER.person.name} (${OWNER.person.url}), a sole trader in ${OPERATOR.city}, Germany.`,
    '',
    `- Web app for personal budgeting by payday cycle, at ${site}/. Languages: ${languages} (one URL; the language is chosen in the app).`,
    `- Payment: monthly subscription through Stripe; prices below are regular prices per month. Cancellation: ${t('landing.faq.cancel.a', 'en')}`,
    `- Seller: ${OPERATOR.legalName}, ${OPERATOR.city}, Germany (full address in the imprint). Contact: ${OPERATOR.email}.`,
    `- The same person also runs ${brands}; they are separate products. Personal site: ${OWNER.person.url}.`,
    '',
    '## Plans',
    '',
    ...planLines(),
    '',
    '## Legal and contact',
    '',
    `- [Terms](${site}/terms), [privacy](${site}/privacy), [imprint](${site}/impressum), [contact](${site}/contact)`,
    '',
  ].join('\n');
}
