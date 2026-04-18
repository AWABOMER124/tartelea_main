# STEP 7: Transition Closure + Hardening

Date: 2026-04-19

## A. Local Environment Setup Guide

### Outcome

The backend local-development story no longer depends on Dokploy or an internal remote host. Developers now have two supported local paths plus a managed-DB fallback:

1. Host-machine PostgreSQL with `DB_HOST=localhost`
2. Docker Compose PostgreSQL with `DB_HOST=db`
3. Managed PostgreSQL through `DATABASE_URL`

### Implemented hardening

- `backend/.env.local.example` documents the local override flow.
- `backend/src/config/env.js` already loads `backend/.env.local` after `backend/.env`.
- `backend/scripts/check_db_connection.js` verifies DB connectivity and prints actionable hints.
- `backend/scripts/check_subscription_catalog.js` now prints the active DB target and clearer failure reasons.
- `backend/scripts/dev_sanity_check.js` chains the DB check and subscription catalog check.
- `backend/src/utils/dbDiagnostics.js` centralizes DB-target formatting and connection guidance.
- `backend/src/server.js` now logs classified DB connection hints on startup failures.
- `backend/README.md` documents:
  - host-machine PostgreSQL setup
  - Docker Compose setup
  - managed `DATABASE_URL` fallback
  - `npm run check:db`
  - `npm run check:subscriptions`
  - `npm run sanity:dev`
  - troubleshooting guidance for `ENOTFOUND`, `ECONNREFUSED`, auth failures, and missing DBs

### Current verification result on this machine

- `backend npm test`: pass (`19/19`)
- `npm run check:db`: fails environmentally because `backend/.env` still points to `DB_HOST=tartelea-va-jjs8rs`
- `npm run sanity:dev`: fails for the same reason

This is no longer a hidden blocker. The failure is explicit and self-diagnosing. A developer can resolve it locally by copying `backend/.env.local.example` to `backend/.env.local` and pointing it to either:

- `localhost:5432`
- `db:5432`
- a valid `DATABASE_URL`

## B. Supabase Cleanup Report

### Before STEP 7 audit

- Direct `supabase.` references: `101` across `41` files

### After STEP 7 closure pass

- Direct `supabase.` references: `85` across `34` files

### After STEP 7 follow-up cleanup

- Direct `supabase.` references: `72` across `26` files

### Main-flow closures completed

The following primary routes no longer read or write through the Supabase client directly:

- `src/pages/AdminDashboard.tsx`
- `src/pages/Library.tsx`
- `src/pages/CourseDetail.tsx`
- `src/pages/Index.tsx`
- `src/pages/Courses.tsx`
- `src/hooks/useCourses.ts`
- `src/components/courses/CourseProgressTracker.tsx`
- `src/components/courses/CourseGroupChat.tsx`
- admin management tabs for content, users, trainer courses, and event approvals

Additional follow-up closures:

- `src/hooks/useAuth.tsx` now syncs directly from backend session storage/events
- `src/components/subscription/SubscriptionCard.tsx` no longer reads auth state through the Supabase client
- `src/components/rooms/CreateRoomDialog.tsx` now uploads through backend media compatibility instead of direct Supabase storage
- `src/hooks/useCapacitorInit.ts` now reacts to app auth state through `useAuth`
- `src/pages/Workshops.tsx`
- `src/pages/WorkshopDetail.tsx`
- `src/pages/WorkshopLive.tsx`
- `src/pages/TrainerProfile.tsx`
- `src/pages/Bookings.tsx`

### Classification of remaining Supabase-style usage

#### Active but non-core to STEP 7

These still use the Supabase-shaped compatibility adapter and should be migrated in later steps, but they are not primary transition blockers anymore:

- bookings and trainer services flows
- workshops creation/live/recording flows
- trainer dashboard/profile/editor tabs
- direct messages and notifications
- room recordings and room reactions
- Cloudflare stream function bridge
- chat/tadabbur helper and subscription card auth-sync helpers

#### Transitional compatibility

- `src/hooks/useAuth.tsx`
- `src/hooks/useCapacitorInit.ts`
- `src/components/subscription/SubscriptionCard.tsx`
- `src/integrations/supabase/client.ts`

These files bridge older auth/session call sites onto backend-owned session state. They are transitional, not owner logic.

#### Deprecated or frozen legacy

- `src/components/community/LegacyCommunityPage.tsx`
- `src/components/community/LegacyPostDetailPage.tsx`

Both now contain explicit `DO NOT USE - LEGACY` markers and are no longer the routed community surface.

### Guardrails added

- `src/integrations/supabase/client.ts` is now explicitly marked `DO NOT USE FOR NEW FLOWS`.
- `scripts/check_transition_closure.mjs` fails if critical flows reintroduce:
  - direct Supabase client usage
  - legacy subscription table references
- the same script verifies that frozen legacy files keep their warning markers

## C. Subscription Legacy Report

### Legacy structures still present

- `monthly_subscriptions`
- `course_subscriptions`
- `course_subscriptions_public`
- `backend/src/routes/compat.routes.js`

### Before STEP 7 audit

- legacy subscription table references: `44` across `11` files

### After STEP 7 closure pass

- runtime and backend-route references: `35` across `8` files
- schema-inventory references in `backend/schema.sql`: `8`
- total repository references: `43` across `9` files

### Ownership status after cleanup

The new backend subscription domain remains the source of truth. Legacy tables now act only as compatibility storage/views for older surfaces.

Primary source of truth:

- `backend/src/services/subscription.service.js`
- backend subscription, entitlement, and plan routes

Compatibility only:

- `backend/src/routes/compat.routes.js`
- `src/lib/backendCourses.ts`
- a few reporting/statistics surfaces

### Important behavior now enforced

- course subscribe/unsubscribe flows route through backend subscription services
- direct writes to `monthly_subscriptions` are blocked in compat routes
- direct deletes for `monthly_subscriptions` are blocked in compat routes
- `compat.routes.js` is explicitly documented as a legacy bridge, not an owner

### Remaining transitional references

- `src/components/stats/TrainerStats.tsx`
- `src/components/stats/TrainerAnalytics.tsx`
- `src/components/stats/LearningStats.tsx`
- `src/pages/TrainerProfile.tsx`
- generated type metadata in `src/integrations/supabase/types.ts`
- schema definitions in `backend/schema.sql`

These are not owner logic for access decisions.

## D. Repo Structure Fix Summary

### Problem

- `.gitmodules` declares only `tartelea_flutter`
- the parent repo still tracked `tartelea-22efd3e6` as a gitlink
- `git submodule status` failed with:
  - `fatal: no submodule mapping found in .gitmodules for path 'tartelea-22efd3e6'`

### Fix applied

- parent `.gitignore` now ignores `/tartelea-22efd3e6/`
- the orphan gitlink was removed from the parent repo index
- `.gitmodules` remains accurate with only `tartelea_flutter`

### Verified final state

- `git submodule status` now resolves without error and lists only `tartelea_flutter`
- `tartelea-22efd3e6` remains on disk as an ignored nested repo artifact, not as a broken parent submodule entry

## E. Code Change Summary

### Backend

- added DB diagnostics utilities and local sanity scripts
- improved backend startup DB failure messages
- expanded backend admin API with multi-role update support
- documented the local DB story in `backend/README.md`
- marked `compat.routes.js` as a legacy bridge only

### Frontend

- moved library, course detail, courses list, index subscription status, and admin dashboard off direct Supabase client usage
- added explicit backend helpers:
  - `src/lib/backendAdmin.ts`
  - `src/lib/backendCompat.ts`
  - `src/lib/backendContent.ts`
  - `src/lib/backendCourses.ts`
- replaced direct course progress/chat queries with backend helper flows
- froze remaining legacy community files with `DO NOT USE - LEGACY` markers

### Verification tooling

- added `npm run check:transition`
- added `scripts/check_transition_closure.mjs`

## F. Final Readiness Check

### What is now true

- critical app flows do not use the direct Supabase client anymore
- backend-owned subscription logic remains the single owner for access decisions
- legacy subscription writes are bridged or blocked instead of owning logic
- local DB failures are diagnosable with clear next steps
- the repo structure no longer needs to carry a broken orphan gitlink

### What is still transitional but acceptable

- several non-core UI surfaces still use the Supabase-shaped compatibility adapter
- legacy schema tables still exist because they support compatibility/reporting during closure
- the current machine still needs a real local PostgreSQL instance or `DATABASE_URL` to make `check:db` and `sanity:dev` pass end-to-end

### Readiness verdict

Transition closure is complete for the critical paths that were blocking the next phase.

What remains after STEP 7 is cleanup-grade work, not architecture debt:

- migrate the remaining non-core Supabase-shaped UI surfaces
- eventually retire compatibility tables/views after those UI surfaces move
- provide a working local PostgreSQL target on each developer machine
