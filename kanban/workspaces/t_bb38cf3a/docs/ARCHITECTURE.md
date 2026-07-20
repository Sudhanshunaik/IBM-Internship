# Architecture Brief — MERN 3D Visualization Platform

> **DRAFT — review before use.** This brief is a forward-looking specification derived from the parent task body ("MERN stack, real-time API data, Three.js for 3D visualizations"). It is intentionally generic at the points where a real architecture brief would be specific to the codebase, because the codebase does not yet exist. Concrete field names, endpoint paths, schema details, and workspace layout will be filled in once `t_e7009f55` (API contract / scaffolding) lands.
>
> See [API.md](./API.md), [SETUP.md](./SETUP.md), and [SOP.md](./SOP.md) for the rest of the package.

## 1. What this app is, in one paragraph

A full-stack web application that ingests real-time data over a push channel, stores it, and renders a 3D visualization of that data in the browser using Three.js. End users (operators, analysts, observers) can authenticate, configure a "scene" that binds to one or more live data sources, and watch the 3D scene update in real time as new data arrives.

## 2. MERN topology at a glance

```
                  ┌──────────────────────────────────────────────────────────┐
                  │                  Browser (React + Three.js)              │
                  │  ┌─────────────┐   ┌─────────────────┐   ┌─────────────┐ │
                  │  │  React UI   │──►│  Three.js scene │◄──│  client     │ │
                  │  └─────────────┘   └─────────────────┘   │  state      │ │
                  │         │                                  └─────────────┘ │
                  │         │   WebSocket / push-stream client                │
                  └─────────┼────────────────────────────────────────────────┘
                            │
                  ┌─────────▼──────────────────────┐
                  │   App server (Node + Express)  │
                  │  REST routes + push broker     │
                  │  controllers, middleware,      │
                  │  auth, validation, error map   │
                  └─────────┬──────────────────────┘
                            │ (Mongoose ODM)
                  ┌─────────▼──────────────────────┐
                  │        MongoDB                 │
                  │   (users, scenes, data,        │
                  │    data points)                │
                  └────────────────────────────────┘
```

The four letters of MERN map to:

| Letter | Role in this app |
|---|---|
| **M**ongoDB | Persistent store for users, scene definitions, data source configurations, and the time-series data points themselves. |
| **E**xpress | HTTP server that hosts the REST API and the push-stream (WebSocket) gateway. |
| **R**eact | Browser UI: scene selection, auth, configuration forms, layout. Does **not** own the 3D scene graph directly. |
| **N**ode.js | The runtime for the Express server. |

## 3. The real-time data flow

The defining constraint is "real-time." The flow is:

1. **Source.** Data arrives continuously from an external producer (a sensor, a polling HTTP API, a manual operator input — concrete choices belong to the implementation, not this spec).
2. **Ingest.** The server receives new data points. A REST endpoint accepts manual ingest; for the external sources, the server runs a background poller or accepts a webhook.
3. **Persist.** Each point is written to MongoDB with its source, timestamp, and a 3D position.
4. **Fan out.** The server publishes each new point (or batch of points) over a push-stream channel — WebSocket in the conventional case. Every connected client that is subscribed to the relevant scene receives the update.
5. **Render.** The browser receives the push, mutates the Three.js scene graph, and the animation loop draws the next frame. No polling, no per-frame HTTP requests.

Why a push stream and not REST polling: polling for "is there new data" at the rate a 3D scene should update is wasteful and laggy. Push is the natural fit.

## 4. Where Three.js plugs in

Three.js lives entirely in the browser. The handoff is:

- The **React tree** owns UI: scene picker, login screen, configuration panels, status badges.
- The **Three.js scene** owns rendering: a `WebGLRenderer` mounted into a canvas element, a camera, controls, and a geometry that represents the current set of data points (for example a `THREE.Points` cloud or instanced meshes).
- The **state store** (a small client store, the implementation will choose) is the bridge. New points from the push stream land in the store; the Three.js animation loop reads from the store each frame and updates the geometry buffers.

The Three.js scene does not manage authentication, persistence, or transport. It is a pure renderer driven by data. The push stream is its only data input; it does not call REST at render time.

## 5. Cross-cutting concerns the implementation must address

These are the categories of decisions the implementation tasks will need to make. They are listed here so the architecture brief is not silent on them, but **none of the specific choices below are sourced from code** — they are conventional defaults for a MERN + real-time + Three.js app and will be re-validated when `t_e7009f55` lands.

- **Auth.** Some form of token-based auth (JWT access + refresh is the standard pattern for this stack). Roles, if any, are simple (e.g. owner vs. admin) — a complex RBAC system is not implied by the parent task.
- **Validation.** Server-side validation of every request body. A schema-first approach (JSON Schema, Zod, or similar) is conventional.
- **Error envelope.** A consistent error response shape across all REST endpoints so the client can render errors uniformly.
- **CORS.** Restrict the browser-side origin.
- **Rate limiting.** Standard protection on the public endpoints.
- **Config / secrets.** All secrets (DB URI, JWT signing keys, external API keys) loaded from environment variables, never from source.
- **Logging.** Structured logs on the server side; redact secrets automatically.

## 6. Open questions for the implementation tasks

These need to be answered by the implementation, not assumed here:

1. **Push transport.** WebSocket (raw `ws` or `socket.io`)? Server-Sent Events? Long-poll? The parent task says "real-time" without specifying the protocol.
2. **Auth model.** Email + password? OAuth? Anonymous read-only with auth for write?
3. **Source ingestion.** Polling a remote API on a timer? A webhook receiver? Operator manual entry? All of the above?
4. **Scene model.** A scene is "a 3D scene bound to data sources" — what fields define a scene, what is the camera/initial state, what is the relationship between a scene and its data sources, and what is the per-source rendering style (points, mesh, sprite)?
5. **Multi-tenancy.** Per-user private scenes only, or shared/public scenes as well?
6. **Persistence shape.** A single collection for data points, or one collection per data source? How long are points retained?
7. **Hosting.** Local dev only for the prototype, or are staging/production targets in scope?

## 7. What this brief is not

- It is not a database schema. The collections and their fields are TBD.
- It is not an API reference. See [API.md](./API.md), which is a stub.
- It is not a setup guide. See [SETUP.md](./SETUP.md), which is a stub.
- It is not a verified onboarding runbook. See [SOP.md](./SOP.md), which is a stub.
