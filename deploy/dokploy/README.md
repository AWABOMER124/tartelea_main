# Dokploy Deployment Hardening (Runbook)

This folder contains *templates* and *checklists* for running Tartelea on Dokploy.

Nothing here should contain real secrets.

## Files

- `stack.example.yml`: a reference multi-service stack showing networking boundaries and Traefik labels
- `env.platform.example`: a naming guide for Dokploy env vars/secrets
- `livekit.yaml`: LiveKit server configuration template (must be edited with real key/secret in Dokploy secrets or mounted as a secret file)

## Routing model (recommended)

- Traefik terminates SSL and routes:
  - `PUBLIC_WEB_HOST` -> `web` (nginx)
  - `PUBLIC_DIRECTUS_HOST` -> `directus`
  - `PUBLIC_LIVEKIT_HOST` -> `livekit` (TCP 7880 via Traefik)
- `web` proxies `/api/*` + `/uploads/*` to `backend` over the private Docker network.
- Only LiveKit UDP port range is exposed publicly (required for WebRTC media).

## Network validation checklist

- Exactly one reverse proxy at the edge (Traefik in Dokploy). Do not run a second host-level nginx.
- Backend is not directly exposed publicly (unless you intentionally add an API router).
- PostgreSQL / Valkey / MinIO are not exposed via host ports.
- All services are on the intended Docker networks:
  - `private` for internal east-west traffic
  - `traefik` for public HTTP(S) traffic

## SSL checklist

- `PUBLIC_WEB_HOST` has a valid certificate and redirects HTTP->HTTPS.
- `PUBLIC_DIRECTUS_HOST` has a valid certificate.
- `PUBLIC_LIVEKIT_HOST` serves wss through Traefik (and UDP ports are open at the host firewall).

## Health / Ready checklist

- Backend:
  - `GET /api/v1/health` -> 200
  - `GET /api/v1/ready` -> 200 only when DB is reachable
- Web:
  - `GET /` -> 200 (SPA served)
- Directus:
  - `GET /server/health` -> 200 (Directus built-in)

## Security baseline checklist

- Rotate any secrets that were ever committed previously (DB password, JWT secret, SMTP creds, LiveKit key/secret).
- Store secrets only in Dokploy secrets, not in git-tracked files.
- Restrict admin-only routes at the gateway (Backend admin already enforces RBAC; still block direct public DB/redis/minio).
- Set `ALLOWED_ORIGINS` explicitly in production and avoid `*`.

## Directus gateway rule

Frontend should not talk to Directus directly.

Only the backend should access the Directus API using `DIRECTUS_URL` + `DIRECTUS_TOKEN`.

