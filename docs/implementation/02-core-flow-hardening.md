# Core Flow Hardening (Phase 2)

This document covers failure modes and technical tasks for purchase, geofence, TTS, and offline route packages.

## 1) Purchase Flow Edge Cases

### Edge cases
- User closes app during payment confirmation.
- Stripe webhook arrives before client callback.
- Duplicate webhook delivery.
- Payment success but entitlement write fails.
- Currency mismatch and stale pricing.
- Refund/chargeback after route already downloaded.

### Hardening tasks
1. Add idempotency key for purchase creation endpoint.
2. Validate Stripe signatures for all webhooks.
3. Build reconciliation job (every 15 minutes):
   - Compare Stripe payment intents with local orders.
   - Auto-heal missing entitlement or mark incident.
4. Add order state machine:
   - `pending` -> `paid` -> `entitled` -> `consumed`
   - failure states: `failed`, `reversed`, `disputed`
5. Introduce immutable price snapshot in order record.

## 2) Geofence Trigger Edge Cases

### Edge cases
- GPS drift triggers wrong POI at dense historical areas.
- Repeated enter/exit events spam audio playback.
- Background location permission denied mid-route.
- Low battery mode reduces location update frequency.
- No network while entering POI with not-cached content.

### Hardening tasks
1. Add hysteresis logic:
   - Enter threshold: 20m
   - Exit threshold: 35m
2. Add POI cooldown (e.g., 120s) to prevent repeated trigger.
3. Rank nearest POI by distance + heading + route step sequence.
4. Add fallback prompt when permission is missing.
5. Persist geofence state locally for app restart recovery.

## 3) TTS/Audio Edge Cases

### Edge cases
- Audio file missing/corrupted on device.
- Language pack unavailable.
- Playback interrupted by phone call or navigation app.
- Device silent mode and volume mismatch.
- Partial download completes but metadata says done.

### Hardening tasks
1. Add checksum validation per audio asset.
2. Define language fallback order: user locale -> EN -> TR.
3. Add resumable playback with position persistence.
4. Add explicit player states (`idle`, `loading`, `playing`, `paused`, `error`).
5. Add content preflight check before route starts.

## 4) Offline Package Edge Cases

### Edge cases
- Device storage nearly full.
- Route package version changed after purchase.
- Interrupted download on weak network.
- User logs out and another user logs in on same device.
- Map tiles become stale after city data updates.

### Hardening tasks
1. Versioned package manifest (`manifest.json`) with checksums.
2. Chunked download with retry/backoff and resume support.
3. Disk quota manager with LRU eviction of old packages.
4. Ownership isolation per user account for cached purchases.
5. Integrity scanner on app start for downloaded packages.

## 5) Technical Delivery Backlog

1. Implement payment state machine + reconciliation worker.
2. Add geofence anti-chatter algorithm and event deduplication.
3. Implement offline package manager module:
   - manifest parsing
   - checksum verification
   - retry/resume
4. Add audio subsystem resilience:
   - fallback language
   - playback recovery
5. Add monitoring:
   - payment mismatch count
   - geofence false trigger ratio
   - audio failure rate
   - offline package corruption rate

## 6) Definition of Done

- Duplicate webhooks do not create duplicate entitlements.
- Geofence trigger precision improves and spam trigger is prevented.
- Audio playback gracefully recovers from interruptions.
- Offline packages remain valid across app restarts and weak network scenarios.
