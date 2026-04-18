# Step 2 Backlog

## Web to Backend Migration

- migrate web auth reads from Supabase session assumptions to backend `/auth/me`
- introduce a web backend-auth adapter and switch login/logout/session flows incrementally
- move admin mutations off direct Supabase writes and onto backend admin routes

## Community Migration

- switch web community feed/details/create/comment/reaction flows from legacy Supabase tables to backend `/community/*`
- stop expanding legacy `posts/comments/reactions`
- expose moderation/reporting UI through backend community admin endpoints

## LiveKit Migration

- replace Supabase function token requests in web with backend `/livekit/token` or room-scoped backend token routes
- keep backend as the only token issuer
