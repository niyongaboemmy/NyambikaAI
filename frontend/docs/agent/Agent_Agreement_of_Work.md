# NyambikaAI — Agent Agreement of Work

Last updated: 2025-09-15

## 1. Parties

- NyambikaAI (the "Platform")
- Agent (the "Agent")

## 2. Scope of Services

- Agent manages producer subscriptions on behalf of the Platform, including:
  - Assigning/claiming producers.
  - Processing subscription payments and renewals.
  - Supporting plan changes and basic producer onboarding.

## 3. Agent Obligations

- Use Platform tools to assist producers and process accurate payments.
- Maintain accurate payment references for reconciliation.
- Adhere to Platform policies, and applicable local regulations.
- Protect producer and customer data; use only for service-related purposes.

## 4. Platform Obligations

- Provide agent dashboard, producers management tooling, and payment flows.
- Track and display commission history and KPIs (see `frontend/src/app/agent-dashboard/page.tsx`).
- Process subscriptions and commissions as per technical implementation (`backend/agent-routes.ts`).

## 5. Compensation and Payouts

- Commission: 40% of each subscription amount for payments processed/attributed to the Agent (stored as `agentCommission` in `subscriptionPayments`).
- Payout schedule: monthly payout for completed commissions; pending or failed items are excluded until status is "completed".
- Currency: RWF.
- Adjustments: refunds/chargebacks or reversals reduce corresponding commissions in future payouts.

## 6. Non-Exclusivity and Assignment

- The Agent engagement is non-exclusive.
- The Platform may assign or reassign producers at its discretion.
- The Agent must disclose conflicts of interest promptly.

## 7. Term and Termination

- At-will engagement; either party may terminate with notice.
- Termination for cause upon material breach, misconduct, or policy violation.

## 8. Compliance and Risk Management

- The Agent complies with anti-fraud, AML, and mobile money guidelines.
- The Agent must not misrepresent plan pricing or Platform terms.
- The Agent must comply with any required KYC/identity verification if applicable.

## 9. Confidentiality and IP

- The Agent must not disclose Platform confidential information.
- Platform retains IP in software and brand. Agent retains personal brand unrelated to Platform assets.

## 10. Dispute Resolution

- Good-faith discussions to resolve disputes. If unresolved, mediation/arbitration per governing law.

## 11. Acceptance

- Use of Platform agent features and receipt of commissions constitutes acceptance of this Agreement.

---

References:

- `backend/agent-routes.ts` — `getAgentStats`, `getAvailableProducers`, `getAgentProducers`, `processSubscriptionPayment`, `assignAgentToProducer`, `getAgentCommissions`
- `frontend/src/app/agent-dashboard/page.tsx` — overview metrics and recent activity
- `frontend/src/app/agent/producers-management/page.tsx` — producer management and payments
- `frontend/src/app/agent/subscription/renew/[producerId]/page.tsx` — guided renewal flow
