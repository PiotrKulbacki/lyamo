import { describe, expect, it, vi, beforeEach } from 'vitest';
import type Stripe from 'stripe';

const { mockFindUnique, mockUpdate } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock('@smart-expense-control/database', () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

vi.mock('@web/features/analytics/posthog-server', () => ({
  captureServerEvent: vi.fn(),
}));

import { captureServerEvent } from '@web/features/analytics/posthog-server';
import {
  handleCheckoutSessionCompleted,
  handleSubscriptionDeleted,
  handleSubscriptionUpdated,
} from '@web/features/billing/services/stripe-webhook.service';

describe('stripe-webhook.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({});
  });

  it('upgrades user to PRO on checkout.session.completed via metadata.userId', async () => {
    mockFindUnique
      .mockResolvedValueOnce({ financialMonthStartDay: 12 })
      .mockResolvedValueOnce({ id: 'user-1', currentPlan: 'FREE' });

    await handleCheckoutSessionCompleted({
      customer: 'cus_123',
      metadata: { userId: 'user-1' },
    } as unknown as Stripe.Checkout.Session);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.objectContaining({
        stripeCustomerId: 'cus_123',
        currentPlan: 'PRO',
        monthlyAiScansCount: 0,
        monthlyAiChatCount: 0,
        pastDueSince: null,
        financialMonthStartDay: expect.any(Number),
      }),
    });
    expect(captureServerEvent).toHaveBeenCalled();
  });

  it('downgrades user to FREE on subscription deleted', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'user-2',
      currentPlan: 'PRO',
      stripeCustomerId: 'cus_456',
      pastDueSince: new Date(),
    });

    await handleSubscriptionDeleted({
      customer: 'cus_456',
      status: 'canceled',
    } as Stripe.Subscription);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'user-2' },
      data: {
        currentPlan: 'FREE',
        pastDueSince: null,
      },
    });
  });

  it('keeps PRO during past_due grace period', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'user-3',
      currentPlan: 'PRO',
      stripeCustomerId: 'cus_789',
      pastDueSince: new Date(),
    });

    await handleSubscriptionUpdated({
      customer: 'cus_789',
      status: 'past_due',
    } as Stripe.Subscription);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'user-3' },
      data: {
        currentPlan: 'PRO',
        pastDueSince: expect.any(Date),
      },
    });
  });

  it('downgrades to FREE when past_due grace expired', async () => {
    const expired = new Date(Date.now() - 25 * 60 * 60 * 1000);

    mockFindUnique.mockResolvedValue({
      id: 'user-4',
      currentPlan: 'PRO',
      stripeCustomerId: 'cus_999',
      pastDueSince: expired,
    });

    await handleSubscriptionUpdated({
      customer: 'cus_999',
      status: 'past_due',
    } as Stripe.Subscription);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'user-4' },
      data: {
        currentPlan: 'FREE',
        pastDueSince: expired,
      },
    });
  });

  it('keeps PRO when subscription is active with cancel_at_period_end', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'user-5',
      currentPlan: 'PRO',
      stripeCustomerId: 'cus_555',
      pastDueSince: null,
    });

    await handleSubscriptionUpdated({
      customer: 'cus_555',
      status: 'active',
      cancel_at_period_end: true,
    } as Stripe.Subscription);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'user-5' },
      data: {
        currentPlan: 'PRO',
        pastDueSince: null,
      },
    });
  });
});
