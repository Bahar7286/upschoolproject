# B2B Operations: Guide Lifecycle, Payout, Moderation (Phase 3)

This document defines the product and technical requirements for guide-side operations.

## 1) Guide Route Lifecycle

### Lifecycle states
- `draft`: editable, not visible.
- `in_review`: submitted for moderation.
- `changes_requested`: blocked until fixes applied.
- `approved`: eligible for publishing.
- `published`: visible for purchase.
- `unpublished`: hidden but retained.
- `archived`: no further edits except clone.

### Transition rules
- Only guide owner can move `draft -> in_review`.
- Only admin/moderator can move review states.
- Publishing requires:
  - complete metadata
  - at least one language narration
  - valid waypoint order
  - pricing defined

## 2) Guide Dashboard Requirements

### Route management
- Create route with map waypoints and stop-level content.
- Attach photo/media with size and format validation.
- Price and estimated duration fields required before review.

### Performance analytics (guide view)
- Views, purchases, completion rate, rating average.
- Top drop-off POIs to improve route quality.

## 3) Payout Requirements

### Wallet model
- `gross_sales`
- `platform_fee`
- `net_earnings`
- `pending_balance`
- `available_balance`
- `paid_out_total`

### Payout flow
1. Guide requests payout amount (above minimum threshold).
2. System validates KYC and available balance.
3. Payout enters `requested`.
4. Admin action or auto-rule moves to `approved` / `rejected`.
5. Stripe transfer executes (`processing` -> `paid` / `failed`).

### Payout states
- `requested`, `approved`, `rejected`, `processing`, `paid`, `failed`, `cancelled`.

### Technical safeguards
- Idempotent payout request token.
- Double-submit prevention.
- Immutable payout ledger entries.
- Failure retry with exponential backoff.

## 4) Moderation Requirements

### Content checks
- profanity and policy compliance scan on text.
- image safety and copyright flag pipeline.
- suspicious pricing anomalies (too high/too low).

### Moderation queue
- Priority by sales potential and publish age.
- SLA targets:
  - first review < 24h
  - re-review < 12h

### Decision logging
- Every moderation decision stores:
  - reviewer id
  - reason codes
  - optional public feedback text

## 5) API and Data Contracts (Minimum)

### Required APIs
- `POST /guide/routes`
- `PATCH /guide/routes/{id}`
- `POST /guide/routes/{id}/submit-review`
- `POST /guide/routes/{id}/publish`
- `GET /guide/analytics/summary`
- `POST /guide/payouts`
- `GET /guide/payouts`
- `POST /admin/moderation/{routeId}/decision`

### Core entities
- `GuideRoute`, `RouteStop`, `RouteAsset`, `ModerationDecision`, `GuideWallet`, `PayoutRequest`.

## 6) Delivery Backlog

1. Implement route lifecycle state machine + authorization checks.
2. Build guide analytics summary endpoints.
3. Build payout ledger and payout request workflow.
4. Implement moderation queue and decision APIs.
5. Add end-to-end tests for:
   - draft to publish
   - payout request to paid
   - moderation reject and resubmit

## 7) Definition of Done

- Guides can create, submit, and publish routes through policy-compliant flow.
- Payout requests are auditable and resilient to retries/failures.
- Moderation decisions are traceable and enforce content quality.
