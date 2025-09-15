# NyambikaAI — Agent Documentation

Last updated: 2025-09-15

## Overview

Agents manage producer subscriptions and earn commissions from subscription payments they process. This document describes Agent capabilities, access rules, producer management, payment processing, commission tracking, and the API surface implemented in the codebase.

Key references:

- Backend agent routes: `backend/agent-routes.ts`
- Agent dashboard: `frontend/src/app/agent-dashboard/page.tsx`
- Producers management hub: `frontend/src/app/agent/producers-management/page.tsx`
- Subscription renewal flow: `frontend/src/app/agent/subscription/renew/[producerId]/page.tsx`
- API configuration: `frontend/src/config/api.ts`

## Role and Access Control

- Role required: `agent` (via `AuthContext`).
- Protected pages:
  - `/agent-dashboard`
  - `/agent/producers-management`
  - `/agent/subscription/renew/[producerId]`

## Core Features

- Dashboard KPIs

  - Endpoint: `GET /api/agent/stats`
  - Implementation: `getAgentStats()` in `backend/agent-routes.ts`
  - Returns: `totalProducers`, `activeSubscriptions`, `expiredSubscriptions`, `totalCommissions`, `monthlyCommissions`, `pendingPayments`.

- Producer Lists

  - Managed producers: `GET /api/agent/producers` via `getAgentProducers()`.
  - Available producers to assign: `GET /api/agent/producers/available` via `getAvailableProducers()`.
  - UI: `frontend/src/app/agent/producers-management/page.tsx`

- Assignment and Subscription

  - Assign agent to producer: `POST /api/agent/assign-producer` handled by `assignAgentToProducer()`.
  - First subscription creation supported by passing `subscriptionPlanId` and `billingCycle`.

- Payment Processing

  - Process subscription payment: `POST /api/agent/process-payment` handled by `processSubscriptionPayment()`.
  - Creates/updates subscription and inserts a `subscriptionPayments` record with computed `agentCommission`.
  - UI flows available from both producers management and the dedicated renewal UI:
    - `frontend/src/app/agent/subscription/renew/[producerId]/page.tsx`

- Commission History
  - Endpoint: `GET /api/agent/commissions` via `getAgentCommissions()`.
  - Used on dashboard for recent activity: `frontend/src/app/agent-dashboard/page.tsx`.

## UI Flows

- Dashboard flow

  - Navigate to `/agent-dashboard`.
  - View KPIs and recent commission activity from `/api/agent/commissions`.

- Producers management

  - Navigate to `/agent/producers-management`.
  - Search/filter producers, view status, assign producers, open payment dialog.
  - Payment dialog fetches plans via `GET /api/subscription-plans` and posts to `/api/agent/process-payment`.

- Subscription renewal (per-producer)
  - Navigate to `/agent/subscription/renew/[producerId]`.
  - Select plan and billing cycle, choose method (MTN MoMo / Airtel / Bank / Wallet), process payment.

## API Endpoints (Agent)

- `GET /api/agent/stats`
- `GET /api/agent/producers`
- `GET /api/agent/producers/available`
- `POST /api/agent/assign-producer`
  - Body: `{ producerId: string, subscriptionPlanId?: string, billingCycle?: 'monthly' | 'annual' }`
- `POST /api/agent/process-payment`
  - Body: `{ producerId: string, planId: string, billingCycle: 'monthly' | 'annual', paymentMethod: string, paymentReference?: string }`
- `GET /api/agent/commissions`

All implemented in `backend/agent-routes.ts`.

## Commission and Payment Rules

- Commission rate: 40% of subscription amount per payment.
- `subscriptionPayments` rows represent payments; `agentCommission` stored per row.
- Billing cycles supported: `monthly` and `annual`.
- Payment methods supported in UI: MTN Mobile Money, Airtel Money, Bank Transfer, Wallet.

## Suggested Operating Standards (Non-binding)

- Follow up on expired subscriptions within 48 hours.
- Ensure accurate payment references for reconciliation.
- Assist producers with plan selection and renewal timelines.

## Changelog

- 2025-09-15: Initial version extracted from codebase and implementation notes.
