# Launch Readiness: Store, Rollout, Rollback (Phase 5)

## 1) App Store / Play Store Preparation Checklist

### Product listing
- App title, subtitle, and localized descriptions (TR/EN/DE).
- Screenshot set per platform and language.
- Promo text and release notes template.
- Privacy policy and terms URLs verified.

### Compliance metadata
- Data safety forms completed (Google Play).
- Privacy nutrition labels completed (App Store).
- Age rating and content declarations.
- In-app purchase metadata and reviewer notes.

### Build and signing
- Versioning policy (`major.minor.patch+build`).
- Signing keys, provisioning profiles, and CI secret management.
- Reproducible release builds from tagged commits.

## 2) Controlled Rollout Strategy

### Feature flag policy
- Critical features behind remote flags:
  - payment
  - geofence auto-trigger
  - offline downloads
  - leaderboard
- Server kill-switches for risky features.

### Rollout phases
1. Internal testers (team and QA).
2. Closed beta cohort (~100 users in Istanbul).
3. 5% production rollout.
4. 25% rollout after stability window (24-48h).
5. 100% rollout after KPI and error thresholds pass.

### Rollout stop conditions
- Crash-free sessions below threshold.
- Payment failure spike.
- Route download success drops below target.
- Elevated API p95 latency.

## 3) Operational Monitoring During Launch

### Live command dashboard
- App crashes by version/platform.
- Payment success/failure funnel.
- Download completion ratio.
- Geofence trigger success ratio.
- API p95 by endpoint.

### On-call protocol
- Launch day incident room with clear owner roles.
- Severity levels and paging policy.
- Incident postmortem template for Sev1/Sev2.

## 4) Rollback Procedure

### Immediate rollback actions
1. Disable risky features via remote config.
2. Stop rollout progression in store consoles.
3. Route purchase traffic through safe fallback if needed.
4. Re-enable only after root cause validation.

### Full rollback triggers
- Sev1 payments or entitlement corruption.
- Severe crash loop in critical user path.
- Data loss risk in offline package layer.

### Recovery validation checklist
- Fresh canary cohort pass.
- Payment reconciliation returns to normal.
- Crash and latency metrics back within baseline.

## 5) Launch Deliverables

- Release checklist signed by Product, Engineering, QA.
- Store submission artifacts package.
- Runbook for launch-day monitoring and rollback.
- Final go/no-go decision document with metrics snapshot.

## 6) Definition of Done

- App listed and approved in both stores.
- Controlled rollout completed with no unresolved Sev1 incidents.
- Rollback tested at least once in staging rehearsal.
