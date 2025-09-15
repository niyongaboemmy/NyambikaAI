# NyambikaAI — Producer Documentation

Last updated: 2025-09-15

## Overview
Producers are vendors/companies who list and sell products on NyambikaAI. This document describes Producer capabilities, access rules, subscription requirements, orders and notifications, and the API surface already implemented in the codebase.

Key references:
- Backend producer routes: `backend/producer-routes.ts`
- Producer dashboard hooks: `frontend/src/hooks/use-producer-dashboard.ts`
- Producer orders page: `frontend/src/app/producer/[producerId]/orders/page.tsx`
- Subscription guard: `frontend/src/components/ProducerSubscriptionGuard.tsx`
- Subscription status hook: `frontend/src/hooks/useProducerSubscriptionStatus.ts`

## Role and Access Control
- Role required: `producer` (via `AuthContext`).
- Subscription requirement enforced by `ProducerSubscriptionGuard` which redirects non‑subscribed producers to `/producer-subscription`.
  - Guard file: `frontend/src/components/ProducerSubscriptionGuard.tsx`
  - Uses `useProducerSubscriptionStatus()` which calls `/api/producer/subscription-status`.

## Core Features
- Dashboard KPIs
  - Endpoint: `GET /api/producer/stats`
  - Implementation: `backend/producer-routes.ts:getProducerStats()`
  - Returns: `totalProducts`, `totalOrders`, `totalRevenue` (computed from `orderItems` for products owned by the producer).

- Orders Management
  - Pages: `frontend/src/app/producer/[producerId]/orders/page.tsx`
  - Producer-scoped APIs: `GET/PUT /api/orders/producer/:producerId` (see Producer Orders memory and usage in orders page).
  - The orders page filters items to the current producer, recalculates subtotals/shipping proportionally, and allows status/notes updates.

- Notifications
  - Component: `frontend/src/components/ProducerNotifications.tsx`
  - Producer notifications API exists per implementation memory: `GET/POST/PUT /api/notifications/producer/[producerId]`.

- Subscription
  - Status check: `GET /api/producer/subscription-status` implemented in `backend/producer-routes.ts:getProducerSubscriptionStatus()`.
  - Activation: `POST /api/producer/subscribe` (invoked from `ProducerSubscriptionGuard` flow).
  - Plans listing: `GET /api/subscription-plans`.

## UI Flows
- Orders flow
  - Navigate to: `/producer/[producerId]/orders`
  - View producer-only items, totals, shipment info, and update status/notes using `PUT /api/orders/producer/:producerId`.

- Subscription flow
  - If no active subscription, guard redirects to `/producer-subscription`.
  - Producer selects plan and billing cycle; activation via `POST /api/producer/subscribe`.

## API Endpoints (Producer)
- `GET /api/producer/stats`
  - Returns: `{ totalProducts, totalOrders, totalRevenue }`
- `GET /api/producer/subscription-status`
  - Returns: `{ hasActiveSubscription, subscriptionId?, status?, expiresAt?, planId? }`
- `POST /api/producer/subscribe`
  - Body: `{ planId: string, billingCycle: 'monthly' | 'annual' }`
- `GET /api/orders/producer/:producerId`
- `PUT /api/orders/producer/:producerId`

## Subscription and Plans
- Commission (agent): 40% of subscription payments processed by agents (global business rule).
- Example plans (from product docs/memory):
  - 1 month: 50,000 RWF
  - 3 months: 135,000 RWF (10% discount)
  - 6 months: 240,000 RWF (20% discount)
  - 12 months: 420,000 RWF (30% discount)

## Suggested Operating Standards (Non-binding)
- Update order statuses within 24 hours.
- Maintain active subscription for uninterrupted access.
- Keep product information current and accurate.

## Changelog
- 2025-09-15: Initial version extracted from codebase and prior implementation notes.
