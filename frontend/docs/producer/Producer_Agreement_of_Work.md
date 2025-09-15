# NyambikaAI — Producer Agreement of Work

Last updated: 2025-09-15

## 1. Parties

- NyambikaAI (the "Platform")
- Producer (the "Vendor" or "Company")

## 2. Scope of Services

- Producer lists, manages, and fulfills products on the Platform.
- Producer uses Platform tooling to manage orders, communicate with customers, and receive notifications.

## 3. Producer Obligations

- Provide accurate product information, pricing, and inventory status.
- Fulfill orders on time and update order statuses promptly using Platform tools (see `frontend/src/app/producer/[producerId]/orders/page.tsx`).
- Maintain an active subscription for full access to producer features (enforced by `frontend/src/components/ProducerSubscriptionGuard.tsx`).
- Comply with Platform policies, local laws, and consumer protection requirements.

## 4. Platform Obligations

- Provide access to producer tools, analytics, and orders dashboard.
- Maintain reasonable uptime and support per standard policies.
- Process subscription status and notify on renewals/expiry (see `backend/producer-routes.ts`).

## 5. Fees and Payments

- Subscription fees per plan selected, billed monthly or annually (see `/api/subscription-plans`).
- Currency: RWF.
- No Platform commission on product sales unless separately agreed in writing; subscription fees are separate from sales revenues.

## 6. Data and Privacy

- Both parties comply with applicable data protection laws.
- Producer agrees to use customer data strictly for order fulfillment and support.

## 7. Intellectual Property

- Producer retains IP rights to their product content.
- Platform retains all rights in software, brand, and design.

## 8. Term and Termination

- Effective upon onboarding and remains until terminated.
- Either party may terminate for convenience with reasonable notice; for cause upon material breach.
- Access to producer features ceases when subscription expires or upon termination.

## 9. Liability and Indemnity

- Producer is responsible for product claims, quality, and fulfillment issues.
- Each party limits liability to direct damages; no indirect or consequential damages to the extent permitted by law.

## 10. Dispute Resolution

- Good-faith negotiation. If unresolved, mediation/arbitration per governing law.

## 11. Acceptance

- Use of Platform producer features constitutes acceptance of this Agreement.

---

References:

- `backend/producer-routes.ts` — `getProducerStats`, `getProducerSubscriptionStatus`
- `frontend/src/components/ProducerSubscriptionGuard.tsx` — subscription enforcement
- `frontend/src/app/producer/[producerId]/orders/page.tsx` — orders management UI
