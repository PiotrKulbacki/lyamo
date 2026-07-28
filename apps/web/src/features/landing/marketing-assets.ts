/**
 * Product screenshots in `apps/web/public/marketing/`.
 * Replace files in place — keep these exact filenames.
 */
export const MARKETING_SHOTS = {
  /** Desktop dashboard — hero + dashboard section */
  heroDashboard: '/marketing/hero-dashboard.webp',
  /** AI chat — “what if I buy X?” */
  featureAiChat: '/marketing/feature-ai-chat.webp',
  /** Scanner draft with category split (mobile crop) */
  featureScannerSplit: '/marketing/feature-scanner-split.webp',
  /** Recent transactions with Split badge */
  featureHistorySplit: '/marketing/feature-history-split.webp',
  /** Mobile dashboard — budget / payday */
  mobileDashboard: '/marketing/mobile-dashboard.webp',
  /** Mobile dashboard — category donut */
  mobileDashboardCategories: '/marketing/mobile-dashboard-categories.webp',
} as const;

export type MarketingShotKey = keyof typeof MARKETING_SHOTS;
