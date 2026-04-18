# Community Backend-Only Note

## Official Decision
- The official community owner is the backend community module under `/api/v1/community/*`.
- Web and mobile are consumers of the backend community contract.
- Legacy Supabase social tables and components are deprecated/frozen and are not the source of truth anymore.

## Official Data Flow
- Web: `BackendCommunityPage` / `BackendPostDetailPage` -> `src/lib/backendCommunity.ts` -> `backendRequest()` -> backend community APIs
- Web admin: `PostManagement` / `CommunityPinsManagement` -> `src/lib/backendCommunityAdmin.ts` -> backend admin/community APIs
- Mobile: `CommunityRepository` -> `ApiClient` -> backend community APIs
- Backend: `community.routes.js` -> validators -> `community.service.js` -> `community.policy.js` -> PostgreSQL community tables

## What Is Frozen
- Direct community reads/writes through `supabase.from("posts" | "comments" | "reactions")`
- Legacy community pages/components that depend on Supabase social tables
- Any new reporting/reaction/comment flow that bypasses `backendCommunity.ts`

## Guardrails
- Do not add new community features on top of legacy Supabase social tables.
- Do not reintroduce source switching for `/community` or `/community/:id`.
- Use `src/lib/backendCommunity.ts` as the only web facade for community APIs.
- Keep legacy community code transitional, commented, and removable later.

## Transitional Surfaces
- `TrendingPostsTicker`
- `SudanAwareness`
- `PinnedContentManagement` and other non-community legacy admin surfaces still on disk for compatibility/reference only
- Legacy community components still on disk for compatibility/reference only

## Next Migration Boundary
- Migrate remaining secondary surfaces that still embed legacy community data so legacy social can be fully removable.
