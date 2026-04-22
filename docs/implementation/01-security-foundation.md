# Security Foundation (Phase 1)

This document defines the implementation baseline for authentication, authorization, rate limiting, and audit logging.

## 1) Authentication Model

### Token strategy
- Access token: JWT, short lived (15 minutes), signed with RS256.
- Refresh token: opaque random token, 30 days, stored hashed in database.
- Device-bound session: each login creates a session record with device fingerprint and refresh token hash.

### Session table
- `id` (uuid)
- `user_id` (uuid)
- `role` (enum: tourist, guide, admin)
- `device_id` (string)
- `refresh_token_hash` (string)
- `ip_address` (string)
- `user_agent` (string)
- `created_at` (timestamp)
- `last_seen_at` (timestamp)
- `revoked_at` (timestamp nullable)

### Auth endpoints
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout` (current session)
- `POST /auth/logout-all` (all sessions)
- `GET /auth/sessions` (active sessions per user)

## 2) Role-Based Access Control (RBAC)

### Roles
- `tourist`: discovery, purchase, route usage, profile.
- `guide`: tourist permissions + route authoring + payout requests + guide analytics.
- `admin`: moderation, disputes, platform analytics, payout approvals.

### Authorization approach
- Route-level policy decorators (backend middleware/dependency).
- Resource ownership checks (guide can modify only own routes).
- Policy matrix source of truth in one file (`auth/policies`).

## 3) API Security Middleware

### Request protections
- Request ID middleware (inject `x-request-id` if absent).
- Rate limiting (IP + user key):
  - Auth endpoints: 10 req/min/IP
  - Purchase endpoints: 30 req/min/user
  - Route browse/search: 120 req/min/user
- Basic abuse controls:
  - Retry cooldown on repeated failed logins.
  - Optional captcha trigger after threshold.

### Input and transport
- Strict schema validation on all payloads.
- HTTPS only in production.
- Secure headers (HSTS, X-Content-Type-Options, X-Frame-Options).

## 4) Audit Log Design

### Critical events to log
- `auth.login.success`, `auth.login.failed`, `auth.refresh.success`, `auth.logout`.
- `payment.intent.created`, `payment.succeeded`, `payment.failed`, `payment.refunded`.
- `guide.route.published`, `guide.route.unpublished`, `admin.content.moderated`.
- `user.role.changed`, `security.rate_limit.triggered`.

### Audit schema
- `event_id` (uuid)
- `event_type` (string)
- `actor_user_id` (uuid nullable)
- `actor_role` (string nullable)
- `target_type` (string nullable)
- `target_id` (string nullable)
- `metadata` (jsonb)
- `ip_address` (string nullable)
- `request_id` (string)
- `created_at` (timestamp)

### Retention and compliance
- 180-day hot retention in primary DB.
- Optional export to object storage for long-term legal retention.
- No sensitive PII (raw card data, plaintext tokens) in logs.

## 5) Phase 1 Backlog (Executable Tasks)

1. Implement auth service with access/refresh rotation.
2. Create session persistence and revoke endpoints.
3. Add role policy middleware/dependencies and policy matrix tests.
4. Add request-id and rate-limit middleware.
5. Add audit event writer utility and event taxonomy.
6. Add security integration tests:
   - invalid token
   - expired refresh
   - role forbidden access
   - rate limit exceed
7. Add security dashboards:
   - failed login count
   - rate limit triggers
   - active sessions per day

## 6) Definition of Done

- Auth + refresh + logout flows pass integration tests.
- Unauthorized and forbidden flows return correct status codes.
- Audit logs generated for all critical events.
- Rate limit active and monitored.
