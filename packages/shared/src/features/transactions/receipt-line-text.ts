/** Matches printed EUR-style amounts with exactly 2 decimal places (e.g. 1,99 / -2,80 / 1.38). */
const RECEIPT_MONEY_TOKEN_PATTERN = /-?\d+[.,]\d{2}/g;

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function parseGermanReceiptMoney(token: string): number | null {
  const normalized = token.trim().replace(',', '.');
  if (!/^-?\d+\.\d{2}$/.test(normalized)) {
    return null;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value) || value === 0) {
    return null;
  }

  return roundMoney(value);
}

/**
 * Derives the line amount from a transcribed receipt line.
 * Uses the RIGHTMOST money token — for quantity lines like
 * "Croissant Nuss  0,69 x  2  1,38 A" that is the line total (1.38), not the unit price.
 */
export function parseAmountFromReceiptLineText(lineText: string): number | null {
  const matches = lineText.match(RECEIPT_MONEY_TOKEN_PATTERN);
  if (!matches?.length) {
    return null;
  }

  const lastToken = matches[matches.length - 1];
  if (!lastToken) {
    return null;
  }

  return parseGermanReceiptMoney(lastToken);
}

export type ReceiptLineItemWithOptionalText = {
  name: string;
  amount: number;
  category: string;
  lineText?: string;
};

/**
 * Prefer amounts parsed from transcribed lineText over model-invented numbers.
 * Falls back to the model's amount when lineText is missing or unparseable.
 */
export function applyAmountsFromLineText<T extends ReceiptLineItemWithOptionalText>(
  lineItems: T[]
): Array<{ name: string; amount: number; category: string }> {
  return lineItems.map((item) => {
    const parsed =
      typeof item.lineText === 'string' && item.lineText.trim().length > 0
        ? parseAmountFromReceiptLineText(item.lineText)
        : null;

    return {
      name: item.name,
      amount: parsed ?? item.amount,
      category: item.category,
    };
  });
}
