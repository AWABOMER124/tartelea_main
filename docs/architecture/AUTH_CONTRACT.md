# Tartelea Auth Contract

## Status

Official for backend-owned auth/session flows as of ADR-001.

## Core Rule

Backend `/auth/*` endpoints are the canonical auth contract for the platform.

Web migration may still consume Supabase during the transition, but any new auth-sensitive logic must target this contract.

## Canonical Auth Session Shape

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "اسم المستخدم",
    "avatarUrl": null,
    "bio": null,
    "country": null,
    "role": "member",
    "roles": ["member"],
    "isVerified": true,
    "status": "active",
    "specialties": [],
    "services": [],
    "socialLinks": {},
    "isPublicProfile": false
  },
  "accessToken": "jwt-token",
  "refreshToken": null
}
```

## Backward Compatibility

During migration, auth responses also include a legacy-compatible nested payload under `data`:

```json
{
  "data": {
    "user": {
      "full_name": "اسم المستخدم",
      "role": "member",
      "is_verified": true
    },
    "token": "jwt-token",
    "accessToken": "jwt-token",
    "refreshToken": null
  }
}
```

This exists to avoid breaking current mobile flows while the official contract moves to the root shape.

## Endpoints

### `POST /auth/signup`

Request:

```json
{
  "email": "user@example.com",
  "password": "secret123",
  "full_name": "اسم المستخدم"
}
```

Response:

- canonical auth session shape when verification is bypassed or completed
- or canonical auth session shape with:
  - `needsVerification`
  - `emailVerificationPending`
  - `emailDelivery`
  - optional `devOtp`

### `POST /auth/login`

Request:

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

Response:

- canonical auth session shape

### `POST /auth/google`

Request:

```json
{
  "idToken": "google-id-token"
}
```

Response:

- canonical auth session shape

### `POST /auth/verify-email`

Request:

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

Response:

- canonical auth session shape

### `GET /auth/me`

Headers:

```text
Authorization: Bearer <jwt>
```

Response:

```json
{
  "success": true,
  "message": "Current user fetched successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "اسم المستخدم",
    "role": "member",
    "isVerified": true,
    "status": "active"
  }
}
```

### `POST /auth/logout`

Headers:

```text
Authorization: Bearer <jwt>
```

Response:

```json
{
  "success": true,
  "message": "Logout acknowledged successfully",
  "user": null,
  "accessToken": null,
  "refreshToken": null,
  "loggedOut": true
}
```

Note:

- logout is currently stateless acknowledgement
- token invalidation/refresh rotation remains a later phase

### `POST /auth/refresh`

Status:

- reserved for later phase
- not implemented in step 1

## Error Shape

All auth endpoints must continue using the unified backend error format:

```json
{
  "success": false,
  "message": "Invalid email or password",
  "error": {
    "message": "Invalid email or password",
    "code": "INVALID_CREDENTIALS"
  }
}
```

## Contract Guardrails

- do not expose `student` as the public role again
- do not emit backend-only storage aliases as official auth contract values
- do not add new auth logic on the web directly against Supabase as if it were canonical
