# Frontend ↔ Backend API Contract

This document defines the contract the frontend expects from the MERN backend
(parent task `t_f339b03a`). The integration task (`t_ab7762fe`) will validate
both ends against this contract.

Base URL is read from `VITE_API_URL` (default `http://localhost:4000`).
WebSocket origin is derived from `VITE_API_URL` automatically.

## REST Endpoints

### `GET /health`
Liveness probe. Response 200 with `{ "status": "ok", "uptime": <seconds> }`.

### `POST /api/auth/register`
Create a new user.
- Body: `{ "email": string, "password": string, "name": string }`
- 201 → `{ "user": { "id", "email", "name" }, "token": <jwt> }`
- 409 if email already exists.

### `POST /api/auth/login`
Authenticate.
- Body: `{ "email": string, "password": string }`
- 200 → `{ "user": { "id", "email", "name" }, "token": <jwt> }`
- 401 on bad credentials.

### `GET /api/auth/me`
Current user (auth required).
- Header: `Authorization: Bearer <jwt>`
- 200 → `{ "id", "email", "name" }`
- 401 if token missing/invalid/expired.

### `GET /api/visualizations`
List domain data records available for visualization (auth required).
- 200 → `{ "items": [ Visualization, ... ] }`

### Visualization shape
```json
{
  "id": "string",
  "label": "string",
  "category": "string",
  "value": 0.0,
  "vector": [0.0, 0.0, 0.0],
  "updatedAt": "ISO-8601 timestamp"
}
```
- `vector` is a 3-tuple of normalized floats in `[-1, 1]`. The frontend maps
  this directly to mesh position/scale in the Three.js scene.
- `value` is a normalized float in `[0, 1]` used for color intensity.

## Authentication

- JWT in response body at login/register.
- Frontend stores token in `localStorage` under key `auth.token`.
- All authenticated requests send `Authorization: Bearer <jwt>` via axios
  interceptor.
- On 401 responses, frontend clears the token and routes to `/login`.

## Real-time channel (Socket.IO)

Connect to same origin as REST base URL.

### Client → Server
- `authenticate` — `{ token: <jwt> }` (emitted right after `connect`).
- `subscribe` — `{ channel: "visualizations" }` (default after auth).
- `unsubscribe` — `{ channel: "visualizations" }`.

### Server → Client
- `connected` — `{ socketId, ts }` on connect.
- `authenticated` — `{ userId, ts }` after a successful `authenticate`.
- `auth_error` — `{ message }` if auth fails.
- `visualization:update` — payload of type `Visualization` (see shape above)
  pushed whenever a record is created/updated on the server.
- `visualization:snapshot` — `{ items: [Visualization, ...] }` sent
  immediately after subscribe, so a reconnecting client gets current state.

### Failure modes the frontend tolerates
- Disconnect: exponential backoff reconnect (socket.io default), state
  preserved in zustand, snapshot re-fetched on re-auth.
- Missing fields: log a warning, skip that payload (don't crash the scene).
- Slow stream: render the latest 50 items; older ones decay.

## CORS
- Server must allow origin from `VITE_APP_ORIGIN` (default
  `http://localhost:5173`) and respond to credentialed requests for the
  websocket upgrade.

## Environment variables

| Name | Default | Purpose |
|------|---------|---------|
| `VITE_API_URL` | `http://localhost:4000` | REST + Socket.IO base |
| `VITE_APP_ORIGIN` | `http://localhost:5173` | For CORS hinting in docs |

If the backend can't be reached, the frontend runs in **demo mode** with a
local mock socket that emits synthetic `visualization:update` events so the
3D scene stays alive. This is a developer-experience fallback, not a
production path.