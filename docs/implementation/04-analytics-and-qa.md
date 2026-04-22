# Analytics, KPI Dashboard, and QA Plan (Phase 4)

## 1) Event Taxonomy (Product Analytics)

All events include common properties:
- `event_name`
- `event_time`
- `user_id` (nullable for anonymous)
- `session_id`
- `platform` (`ios`, `android`, `web-admin`)
- `app_version`
- `city`
- `language`

### Acquisition and onboarding
- `app_opened`
- `onboarding_started`
- `interest_selected`
- `onboarding_completed`

### Discovery and recommendation
- `recommendation_requested`
- `recommendation_shown`
- `route_detail_viewed`

### Commerce
- `checkout_started`
- `payment_intent_created`
- `payment_succeeded`
- `payment_failed`
- `refund_requested`

### Route experience
- `route_download_started`
- `route_download_completed`
- `route_started`
- `poi_triggered`
- `audio_play_started`
- `audio_play_failed`
- `route_completed`

### Engagement
- `badge_earned`
- `leaderboard_viewed`
- `rating_submitted`

## 2) KPI Dashboard Specification

### North star and business KPIs
- Weekly active purchasers (WAU with at least one purchase).
- Purchase conversion rate (`checkout_started` -> `payment_succeeded`).
- Route completion rate (`route_started` -> `route_completed`).
- Guide GMV and net payout trend.

### Quality KPIs
- Crash-free session rate.
- Payment mismatch/reconciliation count.
- Audio failure rate.
- Geofence false trigger ratio.
- Offline download success rate.

### Dashboard slices
- By city
- By language
- By platform
- New vs returning users

## 3) E2E Test Plan (Critical Paths)

### Mobile E2E suites
1. Onboarding and recommendations
2. Purchase and entitlement
3. Download and offline route start
4. Geofence trigger and audio playback
5. Route completion and badge awarding

### Backend integration suites
1. Auth + refresh + role checks
2. Stripe webhook idempotency and reconciliation
3. Guide publish and moderation lifecycle
4. Payout request lifecycle

### Contract tests
- Validate API schema compatibility with mobile client.
- Reject undocumented fields and incompatible enum changes.

## 4) Performance Test Plan

### API latency targets (p95)
- Recommendation endpoint: < 600ms
- Route detail endpoint: < 300ms
- Purchase create endpoint: < 400ms

### Throughput targets
- 1,000 concurrent active users in Istanbul launch window.
- Payment webhook burst handling without order drift.

### Stress and soak scenarios
- 2-hour soak under mixed traffic profile.
- Network degradation simulation for mobile (3G/packet loss).

## 5) Test Environments and Release Gates

### Environments
- `dev`: rapid iteration.
- `staging`: production-like services and seed data.
- `prod`: guarded by rollout flags.

### Go-live quality gates
- No open P0 bugs.
- E2E pass rate >= 95% on staging.
- p95 latency targets met.
- Crash-free sessions >= target (e.g., 99.5%).

## 6) Delivery Backlog

1. Implement event instrumentation map in mobile and backend.
2. Create dashboard views for KPI and quality metrics.
3. Build E2E automation in CI pipeline.
4. Add perf test suite and nightly run.
5. Define release gate report generated automatically per candidate build.
