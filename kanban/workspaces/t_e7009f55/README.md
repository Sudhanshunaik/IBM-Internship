# MERN 3D Visualization Platform

A MERN-stack monorepo for a real-time, Three.js powered 3D data visualization platform.
This repository is structured as an npm workspace monorepo containing:

- `server/`  — Node.js + Express + Mongoose REST + Socket.IO gateway
- `client/`  — React + Vite + Three.js + Zustand frontend
- `shared/`  — TypeScript types and JSON Schema used by both ends

See the full API contract at `docs/API.md` and the OpenAPI definition at `docs/openapi.yaml`.

## Quick start

```bash
cp .env.example server/.env
cp client/.env.example client/.env

npm install
npm run build --workspace=shared
npm run dev
```

The server starts on `:4000`, the client on `:5173`. MongoDB is expected at the URI in `server/.env`.

## Repository layout

```
.
├── server/             # Express + Mongoose + Socket.IO
│   ├── src/
│   │   ├── config/     # env loader, logger
│   │   ├── models/     # Mongoose models
│   │   ├── routes/     # REST routers
│   │   ├── controllers/
│   │   ├── middleware/ # auth, error handling, rate limit
│   │   ├── sockets/    # Socket.IO namespaces / events
│   │   └── index.ts
│   └── package.json
├── client/             # React + Vite + Three.js
│   ├── src/
│   │   ├── components/
│   │   ├── scene/      # Three.js scene graph + animation loop
│   │   ├── hooks/      # data-fetching hooks
│   │   ├── store/      # Zustand state slices
│   │   └── main.tsx
│   └── package.json
├── shared/             # Cross-package types & schemas
│   ├── src/
│   │   ├── types.ts    # User, Scene, DataPoint, AuthPayload, etc.
│   │   ├── schemas/    # JSON Schema files
│   │   └── socket-events.ts
│   └── package.json
└── docs/
    ├── API.md          # human-readable API contract
    └── openapi.yaml    # OpenAPI 3.1 spec
```

## Workspace commands

| Command                     | What it does                            |
|-----------------------------|------------------------------------------|
| `npm install`               | Install all workspaces (root-level)     |
| `npm run dev`               | Run server + client concurrently        |
| `npm run build`             | Build shared, then server, then client  |
| `npm test`                  | Run all workspace tests                 |
| `npm run lint`              | Lint all workspaces                     |
| `npm start --workspace=server` | Run built server in production mode  |

## Conventions

- All shared contracts live in `shared/`; never duplicate a type between client and server.
- Server validates incoming payloads with the JSON Schemas in `shared/schemas` using Ajv.
- Client reads types from `shared/` via path alias `@shared/*` (see `client/tsconfig.json`).
- Auth is JWT in an httpOnly cookie (refresh) + Authorization: Bearer header (access).