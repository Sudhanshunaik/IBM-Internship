# Repository Inventory — MERN 3D Visualization Platform

> **Authoritative source of truth.** Every entry below was read from the source tree on this run. Downstream doc tasks (`API.md`, `SETUP.md`, `SOP.md`, etc.) should treat the linked source files as canonical and this file as the index that tells them what exists where.
>
> **Repo root on disk:** `C:\Users\sudha\AppData\Local\hermes\kanban\workspaces\t_e7009f55`
> **Repo name:** `mern-3dviz-platform` (root `package.json`)
> **Repo layout:** npm workspaces monorepo — `server/`, `client/`, `shared/`
> **Workspace engine pins:** `node >= 18.17.0`, `npm >= 9.0.0`

---

## 0. Top-level layout

```
t_e7009f55/                              # repo root
├── .gitignore
├── README.md                            # human-facing repo README
├── package.json                         # root workspace aggregator
├── package-lock.json
├── server/                              # @mern-3dviz/server (Express + Mongoose + Socket.IO)
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── dist/                            # tsc output (committed by mistake? — see §11)
│   └── src/
│       ├── index.ts                     # entrypoint — buildApp() + main()
│       ├── auth/tokens.ts               # bcrypt + JWT helpers
│       ├── config/
│       │   ├── env.ts                   # Zod-validated env loader (single source of truth)
│       │   ├── logger.ts                # pino logger
│       │   └── mongo.ts                 # mongoose connect/disconnect
│       ├── controllers/
│       │   ├── auth.controller.ts
│       │   ├── datapoints.controller.ts
│       │   ├── datasources.controller.ts
│       │   └── scenes.controller.ts
│       ├── middleware/
│       │   ├── auth.ts                  # requireAuth / optionalAuth / requireRole
│       │   └── errors.ts                # HttpError + validateBody + errorHandler
│       ├── models/                      # Mongoose schemas
│       │   ├── DataPoint.ts
│       │   ├── DataSource.ts
│       │   ├── Scene.ts
│       │   └── User.ts
│       ├── routes/                      # Express routers — see §1 for full inventory
│       │   ├── auth.routes.ts
│       │   ├── datapoints.routes.ts
│       │   ├── datasources.routes.ts
│       │   └── scenes.routes.ts
│       ├── sockets/index.ts             # Socket.IO server (createSocketServer + realtime helpers)
│       ├── types.d.ts                   # Express.Request.auth augmentation
│       ├── workers/simulator.ts         # demo data-feed simulator — NOT WIRED (see §10)
│       └── __tests__/app.test.ts        # vitest + supertest smoke test
├── client/                              # @mern-3dviz/client (React + Vite + Three.js)
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts                   # vite + @/shared aliases + dev proxy
│   ├── dist/                            # vite build output
│   └── src/
│       ├── main.tsx                     # React entrypoint (BrowserRouter)
│       ├── App.tsx                      # top-level routes
│       ├── styles.css
│       ├── vite-env.d.ts
│       ├── api/client.ts                # axios REST client (auth/scenes/datasources/datapoints)
│       ├── hooks/useSceneFeed.ts        # Socket.IO subscription lifecycle
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── SceneListPage.tsx
│       │   └── SceneViewPage.tsx        # *** Three.js <Canvas> mount point — see §3 ***
│       ├── scene/PointCloud.tsx         # Three.js BufferGeometry → <points> renderer
│       └── store/
│           ├── auth.ts                  # Zustand: user, tokens, hydrate, login, logout, register
│           └── sceneFeed.ts             # Zustand: live point buffer (max 5000 points)
├── shared/                              # @mern-3dviz/shared (types + JSON Schemas)
│   ├── package.json
│   ├── tsconfig.json
│   ├── dist/                            # built artifacts (require entry)
│   └── src/
│       ├── index.ts                     # barrel export
│       ├── types.ts                     # User / Scene / DataSource / DataPoint / Auth / etc.
│       ├── socket-events.ts             # SocketEvents const + payload interfaces
│       └── schemas/
│           ├── index.ts                 # Ajv validator + SchemaName union
│           ├── RegisterRequest.json
│           ├── LoginRequest.json
│           ├── RefreshRequest.json
│           ├── CreateSceneRequest.json
│           ├── UpdateSceneRequest.json
│           └── CreateDataSourceRequest.json
└── docs/
    ├── API.md                           # (separate task's deliverable)
    ├── openapi.yaml                     # OpenAPI 3.0.3 spec
    └── WEBSOCKET.md                     # Socket.IO event reference
```

---

## 1. Backend routes — full endpoint inventory

> All paths mounted under `/api/*`. Source files in `server/src/routes/*.routes.ts`, controllers in `server/src/controllers/*.controller.ts`. JSON Schemas (where validation is applied) live in `shared/src/schemas/`.
>
> **Auth shorthand used in tables:**
> - `—`     no auth (public)
> - `opt`   optional auth (`optionalAuth` middleware; `req.auth` may be set)
> - `req`   required auth (`requireAuth` middleware; missing/invalid → 401)
> - `role`  role-gated (`requireRole('admin')` — helper exists in `middleware/auth.ts` but **no route uses it currently**; admin checks are inlined in the controller instead)

### 1.1 Health

| Method | Path | Auth | Handler | Validation | Response | Errors |
|--------|------|------|---------|------------|----------|--------|
| GET    | `/api/health` | — | inline in `index.ts` | none | `HealthResponse` (`status`, `uptimeSeconds`, `mongo`, `socket`, `version`, `timestamp`) | — |

### 1.2 Auth (`auth.routes.ts`)

| Method | Path | Auth | Body schema | Response | Status codes |
|--------|------|------|-------------|----------|--------------|
| POST   | `/api/auth/register` | — | `RegisterRequest` | `AuthResponse` = `{ user: PublicUser, tokens: { accessToken, refreshToken, expiresIn } }`. Refresh cookie `refresh_token` set. | 201 / 400 `validation/json-schema` / 409 `auth/email-taken` |
| POST   | `/api/auth/login` | — | `LoginRequest` | `AuthResponse`. Refresh cookie set. | 200 / 400 / 401 `auth/bad-credentials` |
| POST   | `/api/auth/refresh` | — | `RefreshRequest` (optional — falls back to `refresh_token` cookie) | `{ tokens: AuthTokens }` (note: **no `user` field**). New refresh cookie rotated. | 200 / 400 `auth/no-refresh-token` / 401 `auth/invalid-refresh-token` / 401 `auth/unknown-user` / 401 `auth/refresh-revoked` |
| POST   | `/api/auth/logout` | req | none | 204 No Content. Bumps `User.tokenVersion`, clears cookie. | 204 / 401 `auth/missing-token` / 401 `auth/invalid-token` |
| GET    | `/api/auth/me` | req | none | `{ user: PublicUser }` | 200 / 401 `auth/missing-token` / 404 `auth/user-not-found` |

**Token storage convention** (from `auth.controller.ts:setRefreshCookie`):
- `refresh_token` cookie: `httpOnly`, `sameSite: 'lax'`, `path: '/api/auth'`, `maxAge = JWT_REFRESH_TTL_SEC * 1000`, `secure = COOKIE_SECURE`, `domain = COOKIE_DOMAIN`.
- Access token: returned in JSON, kept in client memory only (`api/client.ts:setAccessToken`). Sent as `Authorization: Bearer ***`.

### 1.3 Scenes (`scenes.routes.ts`)

| Method | Path | Auth | Body schema | Response | Status codes |
|--------|------|------|-------------|----------|--------------|
| GET    | `/api/scenes` | opt | query: `page?`, `pageSize?`, `ownerId?` (ownerId requires auth and only returns own + public unless owner) | `Page<Scene>` (`items, page, pageSize, total`) | 200 / 401 `auth/required` (only if `ownerId` query is given unauthenticated) / 400 `validation/bad-id` |
| POST   | `/api/scenes` | req | `CreateSceneRequest` | 201 + `{ scene: Scene }` | 201 / 400 / 401 |
| GET    | `/api/scenes/:id` | opt | — | `{ scene: Scene }` | 200 / 400 `validation/bad-id` / 404 `scene/not-found` / 403 `scene/forbidden` (private, not owner) |
| PUT    | `/api/scenes/:id` | req | `UpdateSceneRequest` | `{ scene: Scene }` | 200 / 400 / 401 / 403 `scene/forbidden` / 404 |
| DELETE | `/api/scenes/:id` | req | — | 204 | 204 / 401 / 403 / 404 |

### 1.4 Data sources (`datasources.routes.ts`)

| Method | Path | Auth | Body schema | Response | Status codes |
|--------|------|------|-------------|----------|--------------|
| GET    | `/api/datasources` | req | query: `page?`, `pageSize?` | `Page<DataSource>` (only own) | 200 / 401 |
| POST   | `/api/datasources` | req | `CreateDataSourceRequest` (when `kind === 'api-poll'` the schema requires `endpoint` + `pollIntervalMs` via `allOf`/`if`/`then`) | 201 + `{ dataSource: DataSource }` | 201 / 400 / 401 |
| DELETE | `/api/datasources/:id` | req | — | 204 | 204 / 400 `validation/bad-id` / 401 / 403 `datasource/forbidden` (not owner and not admin) / 404 `datasource/not-found` |

> **Known inconsistency** in `datasources.routes.ts:15` — the GET handler is also wrapped in `validateBody('CreateDataSourceRequest')`, which is wrong (it has no body). The body validation is a no-op for GET, but the schema reference is misleading. Flag for the API doc task.

### 1.5 Data points (`datapoints.routes.ts`)

| Method | Path | Auth | Body schema | Response | Status codes |
|--------|------|------|-------------|----------|--------------|
| GET    | `/api/datapoints` | opt | query: `page?`, `pageSize?`, `dataSourceId?` (no body validation) | `Page<DataPoint>` | 200 / 400 `validation/bad-id` (bad `dataSourceId`) |
| POST   | `/api/datapoints` | req | inline `{ dataSourceId, x, y, z, value?, meta? }` (**not schema-validated**) | 201 + `{ dataPoint: DataPoint }` | 201 / 400 / 401 |

### 1.6 Pagination defaults

| Resource | Default pageSize | Max pageSize | Sort |
|----------|------------------|--------------|------|
| Scenes | 20 | 100 | `updatedAt DESC` |
| DataSources | 20 | 100 | `updatedAt DESC` |
| DataPoints | 100 | 500 | `timestamp DESC` |

### 1.7 Error envelope

All errors emitted by `errorHandler` (and `requireAuth`, `notFoundHandler`, `validateBody`) follow the `ApiError` shape from `shared/src/types.ts`:

```json
{ "error": { "code": "<kebab-namespace/code>", "message": "<human>", "details": { /* optional */ } } }
```

Codes observed in code (non-exhaustive):

- `auth/missing-token`, `auth/invalid-token`, `auth/bad-credentials`, `auth/email-taken`, `auth/no-refresh-token`, `auth/invalid-refresh-token`, `auth/unknown-user`, `auth/refresh-revoked`, `auth/user-not-found`, `auth/forbidden` (role), `auth/required` (inline controller check)
- `validation/json-schema`, `validation/zod` (ZodError fallback), `validation/bad-id`
- `scene/not-found`, `scene/forbidden`
- `datasource/not-found`, `datasource/forbidden`
- `route/not-found` (404 handler), `server/internal` (500 fallback)

---

## 2. MERN topology map

### 2.1 MongoDB schemas (`server/src/models/`)

| Collection | Model | Fields | Indexes |
|------------|-------|--------|---------|
| `users` | `UserModel` | `email` (unique, lowercase, trimmed), `username` (unique, trimmed), `passwordHash` (`select: false`, bcrypt 12 rounds — see `auth/tokens.ts`), `role` (`'user' \| 'admin'`, default `'user'`), `tokenVersion` (`select: false`, default 0). `timestamps: true`. | `email`, `username` |
| `scenes` | `SceneModel` | `ownerId` (ObjectId → User, indexed), `title` (req, ≤120), `description` (≤2000), `dataSourceIds` (ObjectId[] → DataSource), `camera` ({ `position: number[3]` default `[0,0,5]`, `target: number[3]` default `[0,0,0]`, `fov: number` default `60` }), `isPublic` (bool, default false, indexed). `timestamps: true`. | `ownerId`, `isPublic` |
| `datasources` | `DataSourceModel` | `ownerId` (ObjectId → User, indexed), `name` (req, ≤80), `kind` (`'sensor' \| 'api-poll' \| 'manual'`, req), `pollIntervalMs` (100..3,600,000), `endpoint` (string). `timestamps: true`. | `ownerId` |
| `datapoints` | `DataPointModel` | `dataSourceId` (ObjectId → DataSource, indexed), `x`, `y`, `z` (all Number, required), `value` (Number), `meta` (Mixed), `timestamp` (Date, default `() => new Date()`, indexed). **No `timestamps: true`** — only the explicit `timestamp` field. | `dataSourceId`, `timestamp`, compound `{ dataSourceId: 1, timestamp: -1 }` |

### 2.2 Express entry & middleware chain

`server/src/index.ts` exports `buildApp()` (testable, no listen) and a top-level `main()` that boots it.

Middleware order:
1. `app.disable('x-powered-by')`
2. `helmet()`
3. `cors({ origin: CORS_ORIGIN.split(','), credentials: true })`
4. `express.json({ limit: '1mb' })`
5. `cookieParser()`
6. `express-rate-limit` with `windowMs=RATE_LIMIT_WINDOW_MS`, `max=RATE_LIMIT_MAX`, `standardHeaders: true`
7. Routes:
   - `GET /api/health` (inline)
   - `/api/auth` → `authRoutes`
   - `/api/scenes` → `sceneRoutes`
   - `/api/datasources` → `dataSourceRoutes`
   - `/api/datapoints` → `dataPointRoutes`
8. `notFoundHandler` (returns `route/not-found`)
9. `errorHandler` (final)

Graceful shutdown: `SIGTERM` / `SIGINT` close HTTP, disconnect Mongo. `unhandledRejection` logs; `uncaughtException` exits 1.

### 2.3 Node services

- **Auth** (`server/src/auth/tokens.ts`): bcrypt hashing (12 rounds), JWT HS256 access/refresh signing+verification. TTLs read from `env.JWT_ACCESS_TTL_SEC` / `env.JWT_REFRESH_TTL_SEC`.
- **Realtime** (`server/src/sockets/index.ts`): Socket.IO server attached to the same `http.Server`. Auth handshake via `socket.handshake.auth.token` OR `socket.handshake.query.token`. Emits to `scene:<id>` and `datasource:<id>` rooms. Exports `realtime.emitDataPointBatch` / `emitDataPointAppend` / `emitSceneUpdated` for controllers/workers to call.
- **Demo worker** (`server/src/workers/simulator.ts`): see §10 — **not wired up**.

### 2.4 React client structure

Entry chain: `client/src/main.tsx` (StrictMode + BrowserRouter) → `App.tsx` (header + routes).

Routes (`App.tsx`):
- `/` → redirect to `/scenes`
- `/login` → `LoginPage` (login + register toggle)
- `/scenes` → `SceneListPage` (calls `sceneApi.list({page:1,pageSize:24})`)
- `/scenes/:id` → `SceneViewPage` (Three.js canvas — §3)

State stores (Zustand):
- `store/auth.ts` — `user`, `tokens`, `hydrating`, `hydrate()`, `register()`, `login()`, `logout()`. `hydrate()` calls `authApi.refresh({refreshToken:''})` so the httpOnly cookie carries the actual refresh token, then `authApi.me()`.
- `store/sceneFeed.ts` — `sceneId`, `points: DataPoint[]` (max 5000, newest-first), `lastReceivedAt`. `setScene()`, `appendPoints()`, `reset()`.

REST client (`api/client.ts`): single `axios` instance with `withCredentials: true`. Access token attached via interceptor from in-memory `memoryAccessToken`. Five API groups: `authApi`, `sceneApi`, `dataSourceApi`, `dataPointApi`, `socketApi` (none — sockets use `socket.io-client` directly in `useSceneFeed`).

### 2.5 Vite dev proxy (`client/vite.config.ts`)

- `/api/*` → `VITE_API_URL ?? 'http://localhost:4000'` (`changeOrigin: true`)
- `/socket.io/*` → same target, `ws: true`, `changeOrigin: true`
- Path aliases: `@shared` → `../shared/src`, `@mern-3dviz/shared` → `../shared/src/index.ts`

### 2.6 WebSocket / Socket.IO layer

- **Path:** `SOCKET_PATH` env (default `/socket.io`) — client reads `VITE_SOCKET_PATH`, server reads `SOCKET_PATH`.
- **Auth:** required (matches REST). Token via `handshake.auth.token` or `handshake.query.token`.
- **Rooms:** `scene:<sceneId>`, `datasource:<dataSourceId>`.
- **Events** (defined in `shared/src/socket-events.ts`):
  - Client → Server: `scene:subscribe` {sceneId}, `scene:unsubscribe` {sceneId}, `datasource:subscribe` {dataSourceId}, `datasource:unsubscribe` {dataSourceId}
  - Server → Client: `datapoint:batch`, `datapoint:append`, `scene:updated`, `presence:join`, `presence:leave`, `socket:error`
- **Presence map** in `sockets/index.ts` keyed `sceneId → userId → username`. Emitted on subscribe/unsubscribe/disconnect.
- **Client hook:** `client/src/hooks/useSceneFeed.ts` opens the socket, subscribes to scene, listens to `datapoint:batch` and `datapoint:append`, pushes points into `useSceneFeedStore`, cleans up on unmount.

---

## 3. Three.js mount point in the React tree

**File:** `client/src/pages/SceneViewPage.tsx`

**Component:** `SceneViewPage` (mounted at route `/scenes/:id`)

**Three.js surface:** the `<Canvas>` element from `@react-three/fiber` plus `OrbitControls` and `Grid` from `@react-three/drei`. Direct `three` import lives in `client/src/scene/PointCloud.tsx`.

**Mount tree:**

```
<SceneViewPage>                                  # pages/SceneViewPage.tsx
  ├── (data fetch) sceneApi.get(id)              # → { scene } REST GET
  ├── (lifecycle) useSceneFeed(scene._id)        # opens Socket.IO, feeds store
  └── <Canvas camera={{ position, fov }} dpr={[1,2]}>      # ← @react-three/fiber
        ├── <color attach="background" args={['#060912']} />
        ├── <ambientLight intensity={0.4} />
        ├── <pointLight position={[10,10,10]} intensity={0.7} />
        ├── <Grid args={[20,20]} ... />          # ← @react-three/drei
        ├── <PointCloud />                       # ← client/src/scene/PointCloud.tsx
        │     • reads `points` from `useSceneFeedStore`
        │     • builds `THREE.BufferGeometry` with `position` + `color` attributes
        │     • renders `<points>` with `<pointsMaterial vertexColors ...>`
        │     • `useFrame` rotates `meshRef.current.rotation.y` by delta * 0.1
        └── <OrbitControls target={scene.camera.target} makeDefault />
```

**Scene data consumed by the Three.js tree:**

| Source | Shape | Used by |
|--------|-------|---------|
| `scene.camera.position` | `[number,number,number]` | `<Canvas camera={{ position }}>` |
| `scene.camera.target` | `[number,number,number]` | `<OrbitControls target>` |
| `scene.camera.fov` | `number` | `<Canvas camera={{ fov }}>` |
| `scene.dataSourceIds` | `string[]` | only displayed in HUD (`data sources: N`) |
| Live `points: DataPoint[]` from Zustand store (`x,y,z,value`) | per-point | `<PointCloud>` → BufferGeometry position + color (color derived from `value`: `0.2+0.8v`, `0.4+0.4(1-v)`, `0.9-0.4v`) |

---

## 4. Environment variables

### 4.1 Server (`server/.env.example`, parsed by `server/src/config/env.ts`)

Validated by Zod at boot — invalid env crashes startup.

| Name | Required | Default | Notes |
|------|----------|---------|-------|
| `NODE_ENV` | no | `development` | one of `development` / `test` / `production` |
| `PORT` | no | `4000` | integer > 0 |
| `HOST` | no | `0.0.0.0` | bind address |
| `LOG_LEVEL` | no | `info` | pino level |
| `CORS_ORIGIN` | no | `http://localhost:5173` | comma-separated list |
| `MONGO_URI` | **yes** | — | min length 1; redacted in logs (`config/mongo.ts:redactUri`) |
| `JWT_ACCESS_SECRET` | **yes** | — | min 16 chars; HS256 |
| `JWT_REFRESH_SECRET` | **yes** | — | min 16 chars; HS256 |
| `JWT_ACCESS_TTL_SEC` | no | `900` | **see inconsistency below** |
| `JWT_REFRESH_TTL_SEC` | no | `1209600` (14d) | **see inconsistency below** |
| `RATE_LIMIT_WINDOW_MS` | no | `60000` | |
| `RATE_LIMIT_MAX` | no | `120` | |
| `COOKIE_SECURE` | no | `false` | coerced boolean |
| `COOKIE_DOMAIN` | no | `localhost` | |
| `SOCKET_PATH` | no | `/socket.io` | |
| `SOCKET_PING_TIMEOUT_MS` | no | `20000` | |
| `SOCKET_PING_INTERVAL_MS` | no | `25000` | |

> **INCONSISTENCY — flag for the SETUP task:**
> `server/.env.example` ships with `JWT_ACCESS_TTL_SECONDS=900` and `JWT_REFRESH_TTL_SECONDS=2592000` (with the trailing `S`), but `server/src/config/env.ts` declares the keys as `JWT_ACCESS_TTL_SEC` and `JWT_REFRESH_TTL_SEC` (no `ONDS`). Following the example as written will not crash but the server will silently fall back to the defaults. Either rename the env keys to match `.env.example` or rename the example to match the code. Recommend picking `JWT_ACCESS_TTL_SEC` / `JWT_REFRESH_TTL_SEC` (shorter, matches the `_MS` style) and fixing the example.

### 4.2 Client (`client/.env.example`, read at build time via `import.meta.env`)

| Name | Required | Default | Consumed at |
|------|----------|---------|-------------|
| `VITE_API_URL` | no | `http://localhost:4000` (vite config default) / `''` at runtime (falls back to same-origin) | `client/src/api/client.ts:17` (`baseURL`), `client/src/hooks/useSceneFeed.ts:8` (`apiUrl`), `client/vite.config.ts:17,21` (proxy target) |
| `VITE_SOCKET_PATH` | no | `/socket.io` | `client/src/hooks/useSceneFeed.ts:7` (`socketPath`) |
| `VITE_DEFAULT_SCENE_ID` | no | (empty) | listed in example but **never referenced in code** — appears to be a placeholder for a future "boot straight into scene" feature |

### 4.3 Cross-cutting

- `process.env.npm_package_version` is read once at `GET /api/health` to populate `HealthResponse.version`.
- No other `process.env.*` reads in source (verified by grep — only the four lines above, plus the `dist/` build artifacts).

---

## 5. Install / dev / start scripts

### 5.1 Root `package.json` (npm workspaces aggregator)

| Script | Command |
|--------|---------|
| `npm run dev` | `concurrently -n server,client -c blue,magenta "npm:dev --workspace=server" "npm:dev --workspace=client"` |
| `npm run build` | `npm run build --workspace=shared && npm run build --workspace=server && npm run build --workspace=client` |
| `npm test` | `npm run test --workspaces --if-present` |
| `npm run lint` | `npm run lint --workspaces --if-present` |
| `npm start` | `npm run start --workspace=server` |

Root `devDependencies`: `concurrently ^8.2.2`.

### 5.2 `server/package.json` (`@mern-3dviz/server`)

| Script | Command |
|--------|---------|
| `npm run dev` | `tsx watch src/index.ts` |
| `npm run build` | `tsc -p tsconfig.build.json` |
| `npm start` | `node dist/index.js` |
| `npm run lint` | `eslint src --ext .ts` |
| `npm test` | `vitest run` |

Runtime deps: `@mern-3dviz/shared`, `bcryptjs`, `cookie-parser`, `cors`, `dotenv`, `express`, `express-rate-limit`, `helmet`, `jsonwebtoken`, `mongoose`, `pino`, `pino-pretty`, `socket.io`, `zod`.
Dev deps: `tsx`, `typescript`, `vitest`, `supertest`, `@types/*` for bcryptjs/cookie-parser/cors/express/jsonwebtoken/node/supertest.

> **Note:** `tsconfig.build.json` is referenced but **not present in the tree**. `npm run build` will fail until that file is added. Flag for the implementation / SETUP tasks.

### 5.3 `client/package.json` (`@mern-3dviz/client`)

| Script | Command |
|--------|---------|
| `npm run dev` | `vite` |
| `npm run build` | `tsc -b && vite build` |
| `npm run preview` | `vite preview --port 5173` |
| `npm run lint` | `eslint src --ext .ts,.tsx` |
| `npm test` | `vitest run` |

Runtime deps: `@mern-3dviz/shared`, `@react-three/drei`, `@react-three/fiber`, `axios`, `react`, `react-dom`, `react-router-dom`, `socket.io-client`, `three`, `zustand`.
Dev deps: `vite`, `@vitejs/plugin-react`, `typescript`, `vitest`, `jsdom`, `@types/{react,react-dom,three}`.

### 5.4 `shared/package.json` (`@mern-3dviz/shared`)

| Script | Command |
|--------|---------|
| `npm run build` | `tsc -p tsconfig.json` |
| `npm run clean` | `rimraf dist` |
| `npm run lint` | `eslint src --ext .ts` |
| `npm test` | `echo 'shared: no tests yet' && exit 0` |

Runtime deps: `ajv`, `ajv-formats`. Dev deps: `rimraf`, `typescript`.

### 5.5 Recommended bootstrap (composed, not in any single script)

```bash
cp server/.env.example server/.env       # then fill JWT_*, MONGO_URI
cp client/.env.example client/.env
npm install                              # installs all three workspaces
npm run build --workspace=shared         # shared types/schemas must compile first
npm run dev                              # concurrently runs server (4000) + client (5173)
```

---

## 6. Cross-package contracts (`shared/`)

Both client and server import from `@mern-3dviz/shared` (resolved via the `npm` workspace symlink, not via path alias — the `paths` aliases in tsconfig only affect the TS compiler, not runtime).

**Type exports** (`shared/src/types.ts`):
- `User`, `PublicUser`
- `RegisterRequest`, `LoginRequest`, `RefreshRequest`, `AuthTokens`, `AuthResponse`
- `JwtAccessPayload`, `JwtRefreshPayload`
- `Scene`, `CreateSceneRequest`, `UpdateSceneRequest`
- `DataSource`, `DataSourceKind` (`'sensor' \| 'api-poll' \| 'manual'`), `CreateDataSourceRequest`
- `DataPoint`
- `Page<T>` (generic envelope), `ApiError`, `HealthResponse`
- `ISODateString`, `ObjectIdString` aliases

**Socket event constants** (`shared/src/socket-events.ts`):
- `SocketEvents` (10 string constants) + `SocketEventName` union
- `SubscribeScenePayload`, `SubscribeDataSourcePayload`, `DataPointBatchPayload`, `DataPointAppendPayload`, `SceneUpdatedPayload`, `PresencePayload`, `SocketErrorPayload`

**JSON Schemas** (`shared/src/schemas/*.json`, validated by Ajv via `shared/src/schemas/index.ts`):
- `RegisterRequest`, `LoginRequest`, `RefreshRequest`, `CreateSceneRequest`, `UpdateSceneRequest`, `CreateDataSourceRequest`

---

## 7. Auth flow (end-to-end)

1. Client posts `RegisterRequest` or `LoginRequest` → server returns `{user, tokens}` + sets `refresh_token` httpOnly cookie (`path: /api/auth`, `sameSite: lax`, `secure` per `COOKIE_SECURE`).
2. Client stores access token in **memory only** (`api/client.ts:setAccessToken`); refresh is never visible to JS.
3. Every authenticated REST call: `axios` interceptor sets `Authorization: Bearer <accessToken>`. WebSocket handshake: `io(url, { auth: { token: accessToken } })`.
4. `requireAuth` middleware accepts either `Authorization: Bearer` header **or** `access_token` cookie (currently the cookie name `access_token` is only read by the middleware — it isn't set anywhere, so in practice only the header is used; the cookie fallback is dead code).
5. Refresh: `POST /api/auth/refresh` with empty body — server reads `refresh_token` cookie, validates JWT + `tokenVersion`, issues new access+refresh and rotates the cookie. Client `hydrate()` does this on app boot.
6. Logout: `POST /api/auth/logout` bumps `User.tokenVersion` (select:false field, default 0); the old refresh token still passes JWT verify but fails the `tokenVersion` check on next refresh.

---

## 8. Real-time data flow

```
                                ┌─────────────────────┐
                                │ server/workers/     │
                                │   simulator.ts      │  (NOT WIRED — see §10)
                                └────────┬────────────┘
                                         │ inserts to Mongo
                                         ▼
┌──────────────┐   Socket.IO    ┌─────────────────────────┐
│ POST         │  ─────────────►│ server/sockets/index.ts │
│ /api/        │  datapoint:    │   realtime.emit*         │
│ datapoints   │  batch/append  └────────┬────────────────┘
└──────────────┘                         │ to rooms scene:<id>
                                         │       datasource:<id>
                                         ▼
                                ┌─────────────────────────┐
                                │ client/hooks/           │
                                │   useSceneFeed.ts       │
                                └────────┬────────────────┘
                                         │ appendPoints()
                                         ▼
                                ┌─────────────────────────┐
                                │ store/sceneFeed.ts      │
                                │   (Zustand, max 5000)   │
                                └────────┬────────────────┘
                                         │ useSceneFeedStore(s => s.points)
                                         ▼
                                ┌─────────────────────────┐
                                │ scene/PointCloud.tsx    │
                                │   THREE.BufferGeometry  │
                                └─────────────────────────┘
```

---

## 9. Test surface

- `server/src/__tests__/app.test.ts` — vitest + supertest. Two suites:
  - `health` (always runs) — GET `/api/health`, asserts `status === 'ok'`.
  - `auth flow` — `describe.skipIf(!env.MONGO_URI || env.MONGO_URI.includes('localhost'))` — skipped by default because local Mongo is required. Exercises register → me → create-scene → list.
- Client/shared test runners (`vitest run`) exist in scripts but no test files are committed.

---

## 10. Known gaps and items to flag downstream

1. **`server/src/workers/simulator.ts` is dead code.** Exports `startSimulator(sceneId)` / `stopSimulator(sceneId)` but nothing imports it — `index.ts` never calls it, controllers never call it. The real-time channel has no producer right now. The `auth flow` test creates a scene but never starts a simulator, so any UI testing of live data will show zero points until this worker is wired up (e.g. on `createScene` for `api-poll` sources, or on socket `scene:subscribe`).
2. **`tsconfig.build.json` is missing.** `server` build script references it but the file doesn't exist.
3. **Env-var name drift** between `server/.env.example` (`JWT_*_TTL_SECONDS`) and `server/src/config/env.ts` (`JWT_*_TTL_SEC`). See §4.1.
4. **Stray `validateBody('CreateDataSourceRequest')` on `GET /api/datasources`** — schema is meant for `POST`. Harmless because GET has no body, but the intent is wrong and should be removed for clarity.
5. **`POST /api/datapoints` has no schema validation.** Other write endpoints route through `validateBody(...)`; this one doesn't. Add a `CreateDataPointRequest` schema for symmetry.
6. **`access_token` cookie fallback** in `middleware/auth.ts` and `shared/types.ts` is unused — only the httpOnly `refresh_token` cookie is ever set. Either start setting `access_token` as a cookie too, or remove the cookie branch.
7. **`requireRole('admin')` helper** in `middleware/auth.ts` is never used. Admin checks are inlined in controllers (`doc.ownerId !== sub && req.auth.role !== 'admin'`). Decide whether to standardize.
8. **`VITE_DEFAULT_SCENE_ID`** is documented in `client/.env.example` but never read. Either implement "boot into this scene" or drop the env var.
9. **`server/dist/` and `client/dist/` are committed** despite `.gitignore` ignoring `dist/`. The ignore works on `dist/` at the root level but the workspace-level `dist/` directories exist in the tree (likely the build was run before commit and the ignore pattern is `dist/` at root only). Verify and clean.
10. **`socket.io-client` is a runtime dep of the client** (not dev) — correct, since `useSceneFeed` runs in the browser.

---

## 11. Source-of-truth file index (one-liners for downstream tasks)

| Task | Source files to read |
|------|----------------------|
| API reference (REST) | `shared/src/types.ts`, `shared/src/schemas/*.json`, `server/src/routes/*.routes.ts`, `server/src/controllers/*.controller.ts`, `docs/openapi.yaml` |
| API reference (WebSocket) | `shared/src/socket-events.ts`, `server/src/sockets/index.ts`, `client/src/hooks/useSceneFeed.ts`, `docs/WEBSOCKET.md` |
| Setup / install / env | `package.json` (root), `server/package.json`, `client/package.json`, `shared/package.json`, `server/.env.example`, `client/.env.example`, `server/src/config/env.ts`, `client/vite.config.ts` |
| Architecture overview | `README.md`, `server/src/index.ts`, `client/src/main.tsx`, `client/src/App.tsx` |
| Three.js scene | `client/src/pages/SceneViewPage.tsx`, `client/src/scene/PointCloud.tsx`, `client/src/store/sceneFeed.ts`, `client/src/hooks/useSceneFeed.ts` |
| Tests | `server/src/__tests__/app.test.ts` |