export const ANALYTICS_EVENTS = {
  AI_SCAN_COMPLETED: 'ai_scan_completed',
  AI_CHAT_MESSAGE_SENT: 'ai_chat_message_sent',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
} as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type AnalyticsEventProperties = {
  ai_scan_completed: {
    userId: string;
    plan: string;
    needsManualReview: boolean;
  };
  ai_chat_message_sent: {
    userId: string;
    plan: string;
    locale: string;
  };
  subscription_upgraded: {
    userId: string;
    previousPlan: string;
    newPlan: string;
    stripeCustomerId?: string;
  };
};
