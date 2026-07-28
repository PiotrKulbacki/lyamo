import { describe, expect, it } from 'vitest';
import {
  applyAmountsFromLineText,
  parseAmountFromReceiptLineText,
  parseGermanReceiptMoney,
} from './receipt-line-text';

describe('receipt-line-text', () => {
  it('parses German and dot decimal money tokens', () => {
    expect(parseGermanReceiptMoney('1,99')).toBe(1.99);
    expect(parseGermanReceiptMoney('-2,80')).toBe(-2.8);
    expect(parseGermanReceiptMoney('1.38')).toBe(1.38);
  });

  it('uses the rightmost money token on quantity lines', () => {
    expect(parseAmountFromReceiptLineText('Croissant Nuss      0,69 x  2     1,38 A')).toBe(1.38);
    expect(parseAmountFromReceiptLineText('Pringles Sour Cream   2,79 x  2     5,58 A')).toBe(5.58);
  });

  it('parses simple single-price lines and discount lines', () => {
    expect(parseAmountFromReceiptLineText('Pure Kornkraft                    1,75 A')).toBe(1.75);
    expect(parseAmountFromReceiptLineText('Sandwiches Käse Schi              1,99 A')).toBe(1.99);
    expect(parseAmountFromReceiptLineText('Lidl Plus Rabatt                 -2,80')).toBe(-2.8);
    expect(parseAmountFromReceiptLineText('Preisvorteil                     -1,46')).toBe(-1.46);
  });

  it('overrides model amounts from lineText transcription', () => {
    const resolved = applyAmountsFromLineText([
      {
        name: 'Sandwiches Käse Schi',
        amount: 2.49,
        category: 'Groceries',
        lineText: 'Sandwiches Käse Schi              1,99 A',
      },
      {
        name: 'Croissant Nuss',
        amount: 0.69,
        category: 'Groceries',
        lineText: 'Croissant Nuss      0,69 x  2     1,38 A',
      },
      {
        name: 'Toastbrötchen Mehrk.',
        amount: 1.08,
        category: 'Groceries',
        lineText: 'Toastbrötchen Mehrk.              0,99 A',
      },
    ]);

    expect(resolved).toEqual([
      { name: 'Sandwiches Käse Schi', amount: 1.99, category: 'Groceries' },
      { name: 'Croissant Nuss', amount: 1.38, category: 'Groceries' },
      { name: 'Toastbrötchen Mehrk.', amount: 0.99, category: 'Groceries' },
    ]);
  });
});
