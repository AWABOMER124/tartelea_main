# Tartelea Production Readiness Roadmap

Last updated: 2026-09-21

## P0 — Code and architecture

- [x] Backend-first auth and role ownership
- [x] Production environment validation
- [x] Backend CI and web/mobile/admin CI
- [x] Database migration runner with checksums
- [x] Admin mutation/audit hardening
- [x] Preserve last active admin invariant
- [x] Profile ownership moved to backend
- [x] Awareness pages moved off direct Supabase access
- [x] Community official flow moved to backend
- [x] Messaging and notifications moved behind backend APIs
- [x] Search/discovery moved behind backend APIs
- [x] Blog, certificates, learning stats moved behind backend APIs
- [x] Workshop runtime and Cloudflare calls moved behind backend
- [x] Trainer profile/services/availability/dashboard moved behind backend
- [x] Secure service-booking domain with overlap/status/review rules
- [x] Room reactions moved to LiveKit data packets
- [x] Room recording upload/delete moved behind guarded backend API
- [x] Dead legacy community components removed
- [x] Mobile secure token storage and expiry validation
- [x] Mobile release build no longer falls back to debug signing
- [x] Web UX redesign and accessibility pass

## P0 — Deployment environment

These tasks require the deployment/provider accounts and cannot be completed by repository changes alone.

- [ ] Run `npm run migrate:db` against the production PostgreSQL database
- [ ] Configure a persistent volume for `/app/uploads` while local recording/media storage is in use
- [ ] Set strong production `JWT_SECRET`
- [ ] Set explicit `ALLOWED_ORIGINS` without wildcard
- [ ] Verify production database credentials and SSL policy
- [ ] Set `OTP_DEV_FALLBACK=false`
- [ ] Configure working SMTP or intentionally set `EMAIL_ENABLED=false`
- [ ] Configure `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET`
- [ ] Configure Cloudflare Stream credentials when workshop streaming is enabled
- [ ] Configure Google OAuth Web client ID and Android package/SHA fingerprints
- [ ] Provide Android release keystore through CI/release secrets
- [ ] Rotate any credentials that were historically committed or exposed
- [ ] Verify PostgreSQL backups and restore procedure

## P0 — End-to-end production verification

Run after production environment configuration and migrations:

1. Signup → Login → Profile
2. Course discovery → Subscribe → Progress → Certificate
3. Community post → Comment → Reaction → Report/moderation
4. Workshop create → Approval → Join → Live → Recording
5. Audio room create → Join → Raise hand → Speaker → Reaction → Recording → Archive
6. Trainer service → Booking → Confirm → Complete → Review
7. Notifications and direct messages
8. Admin moderation, roles, trainer approval, audit log
9. Android Google sign-in, push token registration, and release build install

## P1 — Scale hardening after launch

- Move media/room recordings from local persistent volume to S3-compatible object storage.
- Replace polling in chat/notifications with backend websocket/SSE where scale requires it.
- Move browser auth from JS-readable token storage toward an HttpOnly cookie/BFF session design.
- Add browser-level E2E tests for the critical flows above.
- Add observability for API error rate, latency, DB pool saturation, storage usage, and LiveKit failures.
