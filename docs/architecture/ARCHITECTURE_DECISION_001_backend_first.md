# ADR-001: Backend First Architecture

## Status

Accepted

## Date

2026-04-17

## Context

Tartelea currently operates as multiple adjacent systems:

- web still uses Supabase directly for auth-adjacent, community, and admin-adjacent flows
- backend already owns cleaner API-first logic for auth, RBAC, community lite, and audio rooms
- mobile is closer to backend-first than web
- legacy social tables and new community lite currently coexist
- LiveKit token issuance is split between backend and Supabase function flows

This creates multiple sources of truth in:

- auth
- roles
- community-sensitive logic
- LiveKit token issuing
- admin-sensitive logic

## Decision

Tartelea now adopts **Backend First Architecture** as the official project direction.

### Official Owners

The backend is now the official owner of:

- auth-sensitive logic
- admin-sensitive logic
- community-sensitive logic
- LiveKit token issuing
- role normalization and outward-facing role model

### Transitional Dependencies

Supabase is now classified as **Transitional Only** for this project.

Allowed transitional usage:

- legacy web auth/session handling until web migration is executed
- legacy web community reads/writes until community migration is executed
- legacy web LiveKit token invocation until token migration is executed
- selected mobile initialization dependencies already in place

Supabase is **not** the source of truth for new business logic.

## Freeze Rules

Effective immediately:

- do not add new business logic directly on top of Supabase in web
- do not expand legacy social routes or legacy Supabase community tables
- do not add new LiveKit token flows through Supabase functions
- do not introduce new role logic that depends on `student` as the public role name
- do not add new admin-sensitive flows that bypass backend APIs

## Official Role Model

The official outward-facing application role model is now:

- `guest`
- `member`
- `trainer`
- `moderator`
- `admin`

`student` is deprecated as a public role name and survives only as a temporary storage alias during migration.

## Auth Contract Direction

The backend auth contract is now the official reference for:

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/google`
- `POST /auth/verify-email`
- `GET /auth/me`
- `POST /auth/logout`

The canonical response shape is documented in:

- [AUTH_CONTRACT.md](/abs/c:/Users/DELL/Downloads/tartelea-main/docs/architecture/AUTH_CONTRACT.md)

## Migration Consequences

This ADR does **not** complete the web migration.

It does:

- establish backend ownership
- standardize the role model
- standardize auth response direction
- mark legacy paths as frozen
- prepare adapters for later web migration

## Immediate Code-Level Implications

- backend role normalization must emit `member`, not `student`
- backend auth responses must expose canonical auth/session payloads
- mobile must accept canonical backend auth shape
- web must treat Supabase-first auth/community/LiveKit code as transitional only

## What Changes Later

Phase 2 should migrate:

- web auth consumption to backend auth
- web community from legacy Supabase tables to backend community APIs
- web LiveKit token issuing to backend endpoints
- admin dashboard data mutations to backend admin routes
