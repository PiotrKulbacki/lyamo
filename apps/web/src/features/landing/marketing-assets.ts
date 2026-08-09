/**
 * Product screenshots in `apps/web/public/marketing/`.
 * Prefer sharp PNG captures (2x) over heavily compressed WebP.
 * Regenerate with: `node apps/web/scripts/capture-marketing-shots.mjs`
 */
export const MARKETING_SHOTS = {
  /** Desktop dashboard — hero */
  heroDashboard: '/marketing/hero-dashboard.png',
  /** AI chat */
  featureAiChat: '/marketing/feature-ai-chat.png',
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
