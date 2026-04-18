# Tartelea Role Matrix

## Official Roles

### `guest`

- Meaning: unauthenticated visitor
- Stored in DB: no
- Typical capabilities:
  - browse public pages only
  - no protected write access
- Migration note:
  - used as a derived runtime role, not the primary persisted role for authenticated users

### `member`

- Meaning: default authenticated learner/community member
- Stored in DB: yes, officially
- Transitional storage alias: `student`
- Typical capabilities:
  - authenticated app usage
  - consume content allowed to signed-in users
  - participate in community contexts allowed to members
  - join allowed rooms/workshops
- Migration note:
  - backend maps legacy `student` to public `member`
  - new public APIs must expose `member`

### `trainer`

- Meaning: content/session owner with trainer capabilities
- Stored in DB: yes
- Typical capabilities:
  - trainer dashboard access
  - manage own trainer content
  - create allowed workshops/audio rooms

### `moderator`

- Meaning: trusted operational moderator
- Stored in DB: yes
- Typical capabilities:
  - moderation actions
  - admin-sensitive operational review flows
  - community moderation
  - room management where configured

### `admin`

- Meaning: platform administrator
- Stored in DB: yes
- Typical capabilities:
  - full admin access
  - role management
  - platform-wide moderation
  - operational overrides

## Role Priority

Highest to lowest:

1. `admin`
2. `moderator`
3. `trainer`
4. `member`
5. `guest`

## Legacy Mapping

| Legacy Value | Official Public Role | Notes |
| --- | --- | --- |
| `student` | `member` | deprecated public name, kept only for temporary storage compatibility |
| `member` | `member` | already aligned |
| `guest` | `guest` | derived runtime role |
| `trainer` | `trainer` | aligned |
| `moderator` | `moderator` | aligned |
| `admin` | `admin` | aligned |

## Migration Rules

- backend responses must emit `member`
- mobile role mapping must treat `student` as legacy alias of `member`
- web role helpers must normalize `student -> member`
- no new public contract may introduce `student` again
