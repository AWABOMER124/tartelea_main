# STEP 8: Platform / Dokploy Technical Hardening

Date: 2026-04-19

## Executive Summary

This step focuses on making the Tartelea platform "production-ready" from an infrastructure and deployment standpoint (Dokploy + services), without changing business logic.

Key outcomes delivered in this pass:

- Removed committed secrets and remote-only hostnames from tracked files.
- Hardened local Compose defaults (bind to localhost, healthchecks, restart policies).
- Added a backend readiness endpoint (`/api/v1/ready`) for dependency-aware health.
- Removed hardcoded Traefik test URLs from the web + Flutter clients (config must come from environment).
- Added Dokploy-oriented stack templates and a practical runbook/checklist.

Important note:

- Secrets that were previously committed must be rotated in the real deployment environment.

---

## A) Service Ownership Mapping

| Service | Role | Owner | Depends On |
| --- | --- | --- | --- |
| PostgreSQL | Source of truth (users, community, sessions, subscriptions) | Platform (Dokploy stack) | Persistent volume/storage |
| Valkey/Redis | Cache / rate-limits / CMS cache (optional but recommended) | Platform (Dokploy stack) | Persistent volume (optional), network |
| MinIO | Object storage (Directus media, backups if desired) | Platform (Dokploy stack) | Persistent volume/storage |
| Backend API | Single owner of access decisions + token minting | Backend team | PostgreSQL, LiveKit API credentials, Directus (optional), MinIO (optional) |
| Web App | Admin + web client | Frontend team | Backend API (only), LiveKit URL |
| Flutter App | Mobile client | Mobile team | Backend API (only), LiveKit URL |
| Directus | CMS (content + media) | Platform + Content ops | PostgreSQL, MinIO (recommended), Valkey (recommended) |
| Appsmith | Internal admin tooling (optional) | Platform | PostgreSQL (optional), network |
| Metabase | Analytics/dashboarding (optional) | Platform | PostgreSQL (read-only recommended) |
| LiveKit | Real-time audio | Platform + Backend | Open ports/UDP, API keys shared with backend |
| Traefik | Reverse proxy / SSL termination / routing | Platform (Dokploy) | Public DNS, certificates |

---

## B) Env Report (Used / Cleaned)

### Backend (required)

Required (either/or):

- `DATABASE_URL` (preferred for managed DB)
  - optional: `DATABASE_SSL=true`
- or `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

Also required:

- `JWT_SECRET`

Recommended for production:

- `ALLOWED_ORIGINS` (do not use `*` in production)

Optional (feature flags / integrations):

- `EMAIL_*` + `EMAIL_ENABLED` flags
- `GOOGLE_CLIENT_ID`
- `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
- `DIRECTUS_URL`, `DIRECTUS_TOKEN`

Status:

- `backend/.env.example` has been sanitized (no secrets).
- `backend/.env` is no longer tracked by git (must be provided by Dokploy or the developer locally).

### Web (Vite)

- `VITE_BACKEND_API_BASE_URL` (default: `/api/v1`)
- `VITE_LIVEKIT_URL` (required in production; dev falls back to `ws://localhost:7880`)
- `VITE_USE_BACKEND_COMMUNITY=true` (backend-first guard)

### Flutter (Dart defines)

Use `--dart-define`:

- `API_BASE_URL`
- `LIVEKIT_API_BASE_URL`
- `GOOGLE_SERVER_CLIENT_ID`
- `SUBSCRIPTIONS_PAUSED`

Defaults were updated to local-safe values (`localhost`) and should be overridden in Dokploy/staging/prod builds.

### Directus (platform)

Minimum expected:

- DB connection (recommended: same Postgres instance, different schema/user if desired)
- `KEY`, `SECRET` (Directus security keys)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`

Recommended:

- Configure storage to MinIO (S3-compatible)
- Configure cache to Valkey/Redis

### LiveKit (platform)

Minimum expected:

- LiveKit API keys configured on the server
- Backend uses the same key/secret pair to mint tokens

---

## C) Infra Issues List (Sorted by Severity)

### Critical

- Committed secrets existed in tracked files (`docker-compose.yml`, `backend/.env.example`, tracked `backend/.env`).
  - Fixed by removing tracked secrets and untracking `backend/.env`.
  - Action required: rotate the leaked credentials in the real environment.

- Hardcoded public Traefik test hostnames existed in clients (web + Flutter).
  - Fixed by requiring environment-provided URLs (dev-only localhost fallback).

### High

- No dependency-aware readiness endpoint for load balancers.
  - Fixed: added `GET /api/v1/ready` and switched container healthcheck to use it.

### Medium

- Docker Compose ports were exposed on all interfaces by default (DB/API/Web).
  - Fixed: Compose now binds to `127.0.0.1` by default for local stacks.

- Dokploy/Traefik configuration was implicit (no repo-level runbook/templates).
  - Added: a Dokploy stack template + checklist (see `deploy/dokploy`).

### Low

- Version pinning and full platform stack validation require running in a Docker-enabled environment.
  - This repo now provides templates and checklists, but final validation must happen in Dokploy/staging.

---

## D) Fix Summary (What Changed)

### Secrets + Env

- Untracked `backend/.env` from git (it must never be committed).
- Sanitized `backend/.env.example` to placeholders and added Directus placeholders.

### Compose hardening

- `docker-compose.yml` (root): removed hardcoded secrets, added healthchecks + restart policies, and bound ports to localhost by default.
- `backend/docker-compose.yml`: bound ports to localhost by default.

### Observability

- Added `GET /api/v1/ready` (DB-aware readiness).
- Updated backend container `HEALTHCHECK` to call `/api/v1/ready`.

### Client config

- Web: removed hardcoded LiveKit URL fallback (requires `VITE_LIVEKIT_URL` in production).
- Flutter: removed hardcoded Traefik defaults (defaults to localhost; use `--dart-define` for real env).

---

## E) Readiness Assessment

### Ready for staging?

Yes, with the following conditions:

- Dokploy env vars are set properly (no `.env` committed).
- LiveKit domain/ports are configured and reachable from clients.
- Directus is deployed behind Traefik and only accessed through the backend gateway (current code follows this).

### Ready for production?

Almost. Remaining must-do items are operational rather than code:

- Rotate any previously committed secrets/credentials (DB/JWT/SMTP/LiveKit).
- Confirm a real backup schedule + restore drill for PostgreSQL (runbook provided; implement in platform).
- Confirm Valkey/Redis is enabled where intended (recommended: Directus cache) and not exposed publicly.
- Confirm MinIO bucket policies (public/private) and access keys stored only in Dokploy secrets.
- Validate Traefik routing + SSL for all public domains in a real environment.

---

## Where To Look Next

- Dokploy templates: `deploy/dokploy`
- Local Compose (sanitized): `docker-compose.yml`
- Backend env examples: `backend/.env.example`, `backend/.env.local.example`
- Health endpoints: `backend/src/routes/index.js`

