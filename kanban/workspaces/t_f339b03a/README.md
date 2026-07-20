# mern-backend

Server-side foundation for the MERN prototype: Express + MongoDB (Mongoose) + JWT auth + Socket.IO real-time stream.

## Run locally

```bash
# 1. install deps
npm install

# 2. configure env (edit values, esp. JWT_SECRET)
cp .env.example .env

# 3. make sure mongod is reachable at MONGO_URI (or change it)
#    the server boots even if mongo is down; /health will report degraded.

# 4. start
npm start          # production-style
npm run dev        # nodemon watch mode
```

Server listens on `PORT` (default `4000`).

## Endpoints

| Method | Path                | Auth        | Description                                    |
|--------|---------------------|-------------|------------------------------------------------|
| GET    | `/health`           | public      | Liveness + db state. `200` when mongo is up.   |
| POST   | `/auth/register`    | public      | `{ email, password, name? }` -> `{ user, token }` |
| POST   | `/auth/login`       | public      | `{ email, password }` -> `{ user, token }`     |
| GET    | `/users/me`         | Bearer JWT  | Echoes the authenticated user from the token.  |

Real-time: Socket.IO on the same port. Clients connect to `/` (default namespace).

On connect the server emits `stream:hello`. Every `EXTERNAL_API_POLL_MS` (default 10s) it polls `EXTERNAL_API_URL` and emits a `stream:tick` payload to every connected socket.

### Smoke-testing the socket

```bash
node test/socket.smoke.js
```

Expected: a `stream:hello` event immediately, then a `stream:tick` event within one interval.

### Smoke-testing auth + health

```bash
node test/http.smoke.js
```

Expected: `/health` returns 200, `/users/me` returns 401 without a token, and the register/login flow round-trips a JWT.

## Project layout

```
src/
  config/        # env loading, mongo connection
  models/        # Mongoose schemas (User)
  controllers/   # request handlers (thin)
  services/      # business logic (auth, stream)
  middleware/    # auth, validation, error handler
  routes/        # express routers, mounted in routes/index.js
  app.js         # express + socket.io wiring
  server.js      # entrypoint
test/
  http.smoke.js  # boots app in-process, hits routes with undici
  socket.smoke.js# connects a socket.io client, listens for events
```

## Notes

- Passwords are hashed with bcrypt (cost 12).
- JWTs default to 1h expiry; override with `JWT_EXPIRES_IN`.
- All requests are rate-limited (200 / 15 min per IP) and helmet-hardened.
- The external stream is best-effort: a failed upstream fetch logs a warning and retries on the next tick; clients still receive `stream:hello` on connect.
