import { describe, expect, it } from 'vitest';
import { buildLlmsTxt } from './llms-txt';

describe('buildLlmsTxt', () => {
  const text = buildLlmsTxt('https://lyamo.eu');

  it('starts with the llms.txt title and names the founder and other brands', () => {
    expect(text.startsWith('# Lyamo\n\n> ')).toBe(true);
    expect(text).toContain('Founder and owner: Piotr Kulbacki (https://piotrkulbacki.com/)');
    expect(text).toContain('Cavunio (https://cavunio.com/) and Dokiero (https://dokiero.com/)');
  });

  it('lists every plan with regular monthly prices from the pricing constants', () => {
    expect(text).toMatch(/- Free \(PLN\s?0 \/ €0 \/ £0 \/ \$0 per month\): /);
    expect(text).toMatch(
      /- Pro \(PLN\s?34 \/ €8 \/ £6\.50 \/ \$9 per month\): Everything in Free;/
    );
    expect(text).toContain('- Premium (');
    expect(text).not.toContain('PROMO50');
  });

  it('links the public pages on the given origin', () => {
    expect(text).toContain('[imprint](https://lyamo.eu/impressum)');
    expect(text).toContain('[contact](https://lyamo.eu/contact)');
  });
});
