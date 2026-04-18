# STEP 3: Session / Room Architecture

## Decision
- `Sessions + Rooms + LiveKit access` are backend-owned only.
- `rooms` remains the current storage table, but it is exposed through the backend as the official `session` contract.
- Web and mobile are consumers only.
- Supabase is not allowed to own room access, room roles, or LiveKit token decisions.

## Official data flow
```text
Client
  -> GET /sessions
  -> GET /sessions/:id
  -> POST /sessions/:id/join
  -> POST /sessions/:id/leave
  -> POST /sessions/:id/actions
Backend
  -> validates auth + system role + room role + session status
  -> resolves room access flags
  -> issues LiveKit token when and only when subscribe access is allowed
  -> returns the canonical session/room/access contract
```

## Contract

### Session
- `id`
- `title`
- `description`
- `program_id`
- `track_id`
- `scheduled_at`
- `start_time`
- `end_time`
- `actual_started_at`
- `status`: `scheduled | live | ended`
- `visibility`: `public | restricted`
- `category`
- `image_url`
- `price`

### Room
- `room_id`
- `session_id`
- `room_type`: `stage | open | private`
- `host_id`
- `host`
- `speakers[]`
- `moderators[]`
- `allow_listeners`
- `max_participants`
- `participant_count`

### Access
- `room_role`: `guest | listener | speaker | moderator | co_host | host`
- `is_registered`
- `canJoin`
- `canListen`
- `canSpeak`
- `canModerate`
- `canPublish`
- `canPublishData`
- `canSubscribe`
- `canStartSession`
- `canEndSession`
- `canPromoteSpeaker`
- `canPromoteCoHost`
- `canPromoteModerator`
- `canKick`
- `denialReason`

## Role mapping

| System role | Room role outcome |
| --- | --- |
| `admin` | backend grants moderation semantics when appropriate |
| `moderator` | backend grants moderation semantics when appropriate |
| `trainer` | becomes `host` when owner of the session, otherwise normal policy applies |
| `member` | `listener` by default |
| `guest` | denied join for authenticated room access flows |

Notes:
- `host` is derived from `rooms.host_id`.
- explicit room roles come from `room_roles`.
- backend access policy is the only place allowed to decide publish/subscribe/moderation flags.

## Lifecycle
- `scheduled`: session exists, room metadata exists, no LiveKit token is required yet.
- `live`: join endpoint may issue a LiveKit token when access allows subscribe.
- `ended`: backend denies room join and token issuance.

## Transitional surfaces
- `/livekit/token` is compatibility-only and delegates to `/sessions/:id/join`.
- `/audio-rooms/*` is legacy compatibility-only for older clients.
- direct Supabase reads/writes to `rooms`, `room_roles`, `room_participants`, `room_hand_raises` are frozen in the primary web flow.
