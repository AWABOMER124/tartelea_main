# STEP 3 API Spec

## GET `/sessions`
Lists backend-owned session summaries.

### Query
- `status`: `scheduled | live | ended` optional
- `limit`: optional
- `offset`: optional

### Response shape
```json
{
  "items": [
    {
      "session": {
        "id": "uuid",
        "title": "جلسة صوتية",
        "status": "live",
        "visibility": "public",
        "scheduled_at": "2026-04-17T18:00:00.000Z"
      },
      "room": {
        "room_id": "uuid",
        "session_id": "uuid",
        "host_id": "uuid",
        "participant_count": 18
      },
      "access": {
        "room_role": "listener",
        "canJoin": true,
        "canPublish": false,
        "canSubscribe": true
      }
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

## GET `/sessions/:id`
Returns canonical session details for room UI.

### Response additions
- `participants[]`
- `hand_raises[]`

Notes:
- `hand_raises[]` is visible only when `access.canModerate = true`.

## POST `/sessions`
Creates a new voice session.

### Auth
- required
- allowed system roles: `admin | moderator | trainer`

### Body
```json
{
  "title": "جلسة تفسير",
  "description": "جلسة مباشرة",
  "category": "community",
  "scheduled_at": "2026-04-17T18:00:00.000Z",
  "duration_minutes": 30,
  "price": 0,
  "max_participants": 50,
  "access_type": "public",
  "image_url": "https://..."
}
```

## POST `/sessions/:id/join`
Resolves room access and optionally issues the LiveKit token.

### Auth
- required

### Response
```json
{
  "token": "livekit-jwt-or-null",
  "session": { "...": "..." },
  "room": { "...": "..." },
  "access": {
    "room_role": "speaker",
    "is_registered": true,
    "canJoin": true,
    "canListen": true,
    "canSpeak": true,
    "canModerate": false,
    "canPublish": true,
    "canPublishData": true,
    "canSubscribe": true
  }
}
```

Rules:
- token is returned only when backend allows subscribe access to a live session
- client-supplied role is ignored

## POST `/sessions/:id/leave`
Removes the current user from the participant set when applicable.

## POST `/sessions/:id/actions`
Backend-owned room control actions.

### Body
```json
{
  "action": "promote_speaker",
  "target_user_id": "uuid-optional"
}
```

### Supported actions
- `raise_hand`
- `lower_hand`
- `accept_hand`
- `reject_hand`
- `promote_speaker`
- `demote_listener`
- `promote_co_host`
- `promote_moderator`
- `kick`
- `start_live`
- `end_session`

### Permission rules
- `raise_hand | lower_hand`: authenticated joined listener flow only
- `accept_hand | reject_hand | promote_speaker`: moderation access required
- `promote_co_host | promote_moderator`: host only
- `kick`: host or co-host
- `start_live | end_session`: host only

## Transitional compatibility

### POST `/livekit/token`
- compatibility-only
- delegates internally to `POST /sessions/:id/join`
- must not be used by new clients

### `/audio-rooms/*`
- legacy-only
- not the official contract for new voice/session work
