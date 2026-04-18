# Community Migration Report - Step 2

## Outcome
- `/community` is now backend-only.
- `/community/:id` is now backend-only.
- The backend community module is the only official owner for community logic.
- Legacy Supabase social remains frozen/transitional only and is no longer the primary community owner.

## Inventory

### Active Backend-First
- `src/pages/Community.tsx`
- `src/pages/PostDetail.tsx`
- `src/components/community/BackendCommunityPage.tsx`
- `src/components/community/BackendPostDetailPage.tsx`
- `src/components/community/BackendSessionQuestionsPanel.tsx`
- `src/components/community/CommunityReportDialog.tsx`
- `src/components/admin/PostManagement.tsx`
- `src/components/admin/CommunityPinsManagement.tsx`
- `src/lib/backendCommunity.ts`
- `src/lib/backendCommunityAdmin.ts`
- `src/lib/backendApi.ts`
- `backend/src/routes/community.routes.js`
- `backend/src/routes/community-admin.routes.js`
- `backend/src/services/community.service.js`
- `backend/src/services/community.policy.js`
- `backend/src/middlewares/validators/community.validator.js`
- `tartelea_flutter/lib/data/models/community_models.dart`
- `tartelea_flutter/lib/data/repositories/community_repository.dart`
- `tartelea_flutter/lib/presentation/providers/community_provider.dart`

### Legacy Frozen
- `src/components/community/LegacyCommunityPage.tsx`
- `src/components/community/LegacyPostDetailPage.tsx`
- `src/components/community/PostCard.tsx`
- `src/components/community/PostCommentsDialog.tsx`
- `src/components/community/PostReportDialog.tsx`
- `src/components/admin/PinnedContentManagement.tsx`
- `tartelea_flutter/lib/data/repositories/post_repository.dart`
- `tartelea_flutter/lib/presentation/providers/post_provider.dart`

### Mixed / Transitional
- `src/components/home/TrendingPostsTicker.tsx`
  - Still reads pinned/community data from Supabase for the home surface.
- `src/pages/SudanAwareness.tsx`
  - Still embeds legacy community widgets for a dedicated content surface.

### Removable Later
- `src/components/community/LegacyCommunityPage.tsx`
- `src/components/community/LegacyPostDetailPage.tsx`
- `src/components/community/PostCard.tsx`
- `src/components/community/PostCommentsDialog.tsx`
- `src/components/community/PostReportDialog.tsx`
- `src/components/admin/PinnedContentManagement.tsx`
- `tartelea_flutter/lib/data/repositories/post_repository.dart`
- `tartelea_flutter/lib/presentation/providers/post_provider.dart`

## What Was Migrated In Step 2

### Web Primary Flows
- Feed listing now goes through backend community APIs only.
- Post detail loading now goes through backend community APIs only.
- Post creation uses backend community APIs only.
- Comment creation and reply creation use backend community APIs only.
- Post reactions use backend community APIs only.
- Comment reactions use backend community APIs only.
- Reporting uses backend `/community/reports`.
- Session questions in the primary community surface use backend `/community/session-questions`.

### Backend Contract / Policy Hardening
- Reactions now validate target visibility and publication state before applying.
- Reports now validate target existence, visibility, and publication state before insertion.
- Comment mapping now exposes `viewer_state.can_reply`.
- Session question mapping now exposes `rejected_reason`.
- Created/updated session questions are reloaded through the canonical mapper before returning.

### Mobile Contract Alignment
- `CommunityViewerStateModel` now understands `can_reply` and `can_manage`.
- Legacy mobile social repository/providers are explicitly deprecated in favor of `CommunityRepository`.

### Admin Community Migration
- Community post moderation now uses backend admin/community APIs instead of legacy Supabase `posts`.
- Community pin management now uses backend `community_pins` instead of legacy `pinned_content`.
- The dashboard summary count for community posts now comes from backend admin/community APIs.

## File-by-File Change Summary

### Web
- `src/pages/Community.tsx`
  - Removed source switching and fixed the route to backend community only.
- `src/pages/PostDetail.tsx`
  - Removed source switching and fixed the route to backend community detail only.
- `src/components/community/BackendCommunityPage.tsx`
  - Continued backend-only feed flow, added pagination, report actions, and session question panel wiring.
- `src/components/community/BackendPostDetailPage.tsx`
  - Completed backend-only detail flow for comments, replies, comment reactions, and reporting.
- `src/components/community/CommunityReportDialog.tsx`
  - Added the official backend report dialog for posts/comments/questions.
- `src/components/community/BackendSessionQuestionsPanel.tsx`
  - Added backend-only list/create UI for session questions.
- `src/lib/backendCommunity.ts`
  - Promoted to the official web community facade and expanded the shared contract types and API calls.
- `src/lib/backendCommunityAdmin.ts`
  - Added the official web admin facade for community moderation, reports, contexts, posts, and pins.
- `src/components/admin/PostManagement.tsx`
  - Rebuilt to manage backend community posts and pending reports through Community Admin APIs.
- `src/components/admin/CommunityPinsManagement.tsx`
  - Added backend-owned management for `community_pins`.
- `src/pages/AdminDashboard.tsx`
  - Switched community post counts and community pin management to backend admin/community APIs.
- `src/components/community/LegacyCommunityPage.tsx`
  - Marked as frozen and no longer primary-route owned.
- `src/components/community/LegacyPostDetailPage.tsx`
  - Marked as frozen and no longer primary-route owned.
- `src/components/community/PostCard.tsx`
  - Marked as legacy-only/frozen.
- `src/components/community/PostCommentsDialog.tsx`
  - Marked as legacy-only/frozen.
- `src/components/community/PostReportDialog.tsx`
  - Marked as legacy-only/frozen.
- `src/components/home/TrendingPostsTicker.tsx`
  - Marked as transitional because it still consumes Supabase-side community data.
- `src/pages/SudanAwareness.tsx`
  - Marked as transitional because it still embeds legacy community widgets.
- `src/components/admin/PinnedContentManagement.tsx`
  - Left frozen as a legacy non-community pinning surface.

### Backend
- `backend/src/services/community.service.js`
  - Hardened reaction/report policy checks and standardized mapped question/report responses.
- `backend/src/services/community.policy.js`
  - Confirmed as the sole policy authority for readability/writability/management checks.
- `backend/src/routes/community.routes.js`
  - Confirmed as the official public community API surface.
- `backend/src/routes/community-admin.routes.js`
  - Expanded with backend-owned list endpoints for admin posts and community pins.
- `backend/src/middlewares/validators/community.validator.js`
  - Expanded to validate admin post/pin listing queries.

### Flutter
- `tartelea_flutter/lib/data/models/community_models.dart`
  - Expanded viewer-state parsing to align with backend/web contract fields.
- `tartelea_flutter/lib/data/repositories/post_repository.dart`
  - Marked deprecated.
- `tartelea_flutter/lib/presentation/providers/post_provider.dart`
  - Marked deprecated.

## Remaining Backlog
- Migrate `TrendingPostsTicker` to backend community or another backend-owned content feed.
- Migrate `SudanAwareness` community widgets to backend community.
- Remove frozen legacy community components once secondary surfaces stop depending on them.

## Remaining Risks
- Secondary surfaces still reading legacy Supabase social data can confuse maintenance if they are extended accidentally.
- Legacy non-community pinning via `PinnedContentManagement` can still confuse future work if someone mistakes it for official community pinning.
- Legacy files still exist in the tree, so new contributors must follow the new architecture note and freeze markers.
- Flutter is contract-aligned for viewer state, but session-question UI is still web-first in this phase.
