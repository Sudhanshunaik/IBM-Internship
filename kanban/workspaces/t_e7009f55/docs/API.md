# API Contract

Source of truth: **`docs/openapi.yaml`** (OpenAPI 3.0.3) and **`docs/WEBSOCKET.md`**.

Both server and client import shared TypeScript types and JSON Schemas from
`shared/` — never duplicate them. Anything in this document that disagrees with
`shared/src/types.ts` or `shared/src/schemas/*.json` is wrong; fix the doc.

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│  client (Vite + React + Three.js)                                        │
│   - REST client (axios) at /api/*                                        │
│   - Socket.IO client at /socket.io                                       │
└────────────┬─────────────────────────────────────────────────────────────┘
             │  HTTPS  │  WSS
             ▼         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  server (Express + Socket.IO + Mongoose)                                │
│   - /api/*         REST                                                 │
│   - /socket.io     realtime                                             │
│   - /api/health    probe                                                │
└────────────┬─────────────────────────────────────────────────────────────┘
             ▼
       MongoDB (mongodb://…)
```

## Auth flow

1. `POST /api/auth/register` → returns `{ user, tokens }` AND sets the
   `refresh_token` httpOnly cookie.
2. Client stores `accessToken` in memory (never localStorage — refresh is in
   the cookie).
3. Every authenticated REST call sends `Authorization: Bearer <accessToken>`.
4. On 401 with `code: "auth/invalid-token"` the client calls
   `POST /api/auth/refresh` (cookie automatically sent) → swaps in the new
   access token and retries the original request.
5. `POST /api/auth/logout` bumps `User.tokenVersion`; the cookie is cleared
   server-side. Existing access tokens remain valid until expiry.

Access tokens are HS256, **15-minute TTL** by default. Refresh tokens are HS256,
**14-day TTL**. Both secrets must be at least 16 chars — see `server/.env.example`.

## MongoDB collections

| Collection   | Indexes                                                   |
|--------------|-----------------------------------------------------------|
| `users`      | `{ email: 1 } unique`, `{ username: 1 } unique`           |
| `scenes`     | `{ ownerId: 1 }`, `{ isPublic: 1 }`                       |
| `datasources`| `{ ownerId: 1 }`                                          |
| `datapoints` | `{ dataSourceId: 1, timestamp: -1 }`                      |

In production, `datapoints` should be backed by a MongoDB time-series collection;
the current schema is portable across regular collections.

## REST endpoints (summary)

Full schemas are in `docs/openapi.yaml`. Summary:

| Method | Path                          | Auth   | Notes                                  |
|--------|-------------------------------|--------|----------------------------------------|
| GET    | `/api/health`                 | none   | Liveness + mongo + socket state        |
| POST   | `/api/auth/register`          | none   | Returns tokens; sets refresh cookie    |
| POST   | `/api/auth/login`             | none   | Returns tokens; sets refresh cookie    |
| POST   | `/api/auth/refresh`           | cookie | Returns new access + rotates refresh   |
| POST   | `/api/auth/logout`            | bearer | Bumps tokenVersion                     |
| GET    | `/api/auth/me`                | bearer | Current user                           |
| GET    | `/api/scenes`                 | opt    | `?ownerId=` requires auth              |
| POST   | `/api/scenes`                 | bearer | Create                                 |
| GET    | `/api/scenes/:id`             | opt    | 403 if private and not owner           |
| PUT    | `/api/scenes/:id`             | bearer | Owner or admin                         |
| DELETE | `/api/scenes/:id`             | bearer | Owner or admin                         |
| GET    | `/api/datasources`            | bearer | Owner-only                             |
| POST   | `/api/datasources`            | bearer | Create                                 |
| DELETE | `/api/datasources/:id`        | bearer | Owner or admin                         |
| GET    | `/api/datapoints`             | opt    | `?dataSourceId=` filter                |
| POST   | `/api/datapoints`             | bearer | Append a single point                  |

All bodies are validated against the JSON Schemas in `shared/src/schemas/*.json`.
Validation failures return `400` with `code: "validation/json-schema"` and a
`details.errors` array.

All errors share this shape:

```json
{
  "error": {
    "code": "auth/invalid-token",
    "message": "Invalid or expired token",
    "details": { "...": "..." }
  }
}
```

## WebSocket events

See **`docs/WEBSOCKET.md`** for the full real-time contract. Quick summary:

- Client opens one Socket.IO connection with the JWT in `auth.token`.
- Client subscribes per-scene with `scene:subscribe` and per-data-source with
  `datasource:subscribe`.
- Server emits `datapoint:batch`, `datapoint:append`, `scene:updated`, and
  `presence:join`/`presence:leave` to the appropriate room.

## Environment variables

| Name                        | Required | Default                        | Purpose                                    |
|-----------------------------|----------|--------------------------------|--------------------------------------------|
| `NODE_ENV`                  | no       | `development`                  | Affects logger and `secure` cookie flag    |
| `PORT`                      | no       | `4000`                         | HTTP listen port                           |
| `HOST`                      | no       | `0.0.0.0`                      | HTTP bind address                          |
| `LOG_LEVEL`                 | no       | `info`                         | Pino log level                             |
| `CORS_ORIGIN`               | no       | `http://localhost:5173`        | Comma-separated list of allowed origins    |
| `MONGO_URI`                 | yes      | —                              | Mongoose connection string                 |
| `JWT_ACCESS_SECRET`         | yes      | —                              | HS256 secret for access tokens (≥16 chars) |
| `JWT_REFRESH_SECRET`        | yes      | —                              | HS256 secret for refresh tokens (≥16 chars)|
| `JWT_ACCESS_TTL_SEC`        | no       | `900`                          | Access token TTL                           |
| `JWT_REFRESH_TTL_SEC`       | no       | `1209600` (14d)                | Refresh token TTL                          |
| `RATE_LIMIT_WINDOW_MS`      | no       | `60000`                        | Rate-limit window                          |
| `RATE_LIMIT_MAX`            | no       | `120`                          | Max requests per window per IP             |
| `COOKIE_SECURE`             | no       | `false`                        | Set `true` behind HTTPS                    |
| `COOKIE_DOMAIN`             | no       | `localhost`                    | Cookie domain                              |
| `SOCKET_PATH`               | no       | `/socket.io`                   | Socket.IO mount path                       |
| `SOCKET_PING_TIMEOUT_MS`    | no       | `20000`                        | Ping timeout                               |
| `SOCKET_PING_INTERVAL_MS`   | no       | `25000`                        | Ping interval                              |

Client-side (Vite):

| Name                    | Default                | Purpose                              |
|-------------------------|------------------------|--------------------------------------|
| `VITE_API_URL`          | `''` (same origin)     | Base for both REST and Socket.IO     |
| `VITE_SOCKET_PATH`      | `/socket.io`           | Must match server `SOCKET_PATH`      |
| `VITE_DEFAULT_SCENE_ID` | `''`                   | Scene to load on boot                |

## Security posture

- All inputs validated against JSON Schemas (Ajv) before reaching controllers.
- `helmet`, `cors` (origin allow-list), `express-rate-limit`, `cookie-parser`
  with `httpOnly`+`sameSite=lax` refresh cookies.
- Passwords hashed with bcrypt (12 rounds); never returned by REST.
- Object IDs validated on every `:id` route — no `findById` without a
  pre-check.
- Mongo injection not possible (we use Mongoose `Schema` everywhere).
- No secrets are committed; `.env.example` lists every variable.
- `helmet` enables strict CSP and other defaults; loosen only with intent.