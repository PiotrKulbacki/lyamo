---
name: lyamo-stripe
description: Work on Lyamo Stripe coupons, Checkout, subscription entitlements and webhooks for S09/S10 or an explicitly assigned billing task. Preserve the two-month coupon promotion.
---

# Lyamo Stripe

- Read the assigned card and Stripe section in `docs/security/INTEGRATIONS.md`. Discover installed Stripe producer skills and read the relevant best-practices/integration skill. Prefer connected tools, then official authenticated CLI/API if capabilities are insufficient. Confirm account ID and test/Sandbox versus live for every operation.
- User confirmed the two free months are a Stripe coupon promotion. Inspect the actual coupon/promotion code: discount, duration, products/prices, currencies, redemption and eligibility. Do not add trial_period_days or a second discount. An active subscription with a zero invoice can be valid.
- Do not modify live customer subscriptions, coupons, payment methods or charges while testing. Use isolated test customers, Stripe test/Sandbox and supported Test Clock scenarios. Tool installation/OAuth does not itself prove sandbox scope.
- Verify whether payment method collection is required on a zero initial invoice. Derive the first payment date and amount from the actual subscription/discount behaviour; subscription mode alone is not sufficient evidence.
- Maintain signature checking over the raw webhook body, idempotency, event ordering protection and reconciliation with authoritative subscription status. Validate user/customer/price/plan binding server-side. A success URL or metadata alone cannot grant paid access.
- Distinguish paid, discounted, trialing, incomplete, past_due, unpaid and cancelled states. A zero invoice is not failure; an unqualified checkout completion is not proof of entitlement. Preserve the separately available FREE plan.
- Verify duplicate checkout protection, delayed events, expiration/cancellation, transition after the coupon and failed first real invoice. Never wait two real months or charge a real card for regression testing.
- Record account/mode and non-secret object IDs, tested lifecycle, configuration changes, release state and gaps in the task report. Keep keys, signatures and customer records out of the report.

Current sources: official Stripe MCP, Checkout, coupons, subscriptions and webhook documentation. Follow existing task authorisation; prepare any unforeseen live financial mutation for explicit review rather than treating account connection as consent.
