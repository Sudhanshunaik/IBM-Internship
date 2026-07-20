# API Reference

> **DRAFT — review before use. This document is a stub.** Per the task acceptance criteria, API documentation is to be "generated from the backend route definitions." The backend route definitions do not yet exist — `t_4effd51b` (server implementation) is `todo` and depends on `t_e7009f55` (API contract) which is also `todo`. **No endpoint paths, request schemas, response schemas, or error codes are recorded in this document**, because inventing them would be fabrication. Once `t_4effd51b` lands, re-dispatch this task and fill this file from the actual route files.

## What the API is expected to expose (categories only)

Based on the parent task ("MERN stack, real-time API data, Three.js 3D visualization"), the implementation is expected to expose endpoints in the following categories. Specific routes and shapes are not yet defined.

| Category | Purpose | Will be sourced from |
|---|---|---|
| Auth | Sign up, sign in, sign out, current-user, token refresh | Route file under `server/src/routes/auth.*` once `t_4effd51b` lands |
| Scenes | CRUD for "3D scenes" (the user's saved view configuration) | Route file under `server/src/routes/scenes.*` once `t_4effd51b` lands |
| Data sources | CRUD for "data sources" (configuration of an upstream data feed) | Route file under `server/src/routes/datasources.*` once `t_4effd51b` lands |
| Data points | Read historical data points (used by the client to backfill the Three.js scene before the live stream catches up) | Route file under `server/src/routes/datapoints.*` once `t_4effd51b` lands |
| Health | Liveness/readiness probe | Route file under `server/src/routes/health.*` once `t_4effd51b` lands |

## Conventions the parent task implies (still to be confirmed)

These are conventional for a MERN REST API. They will be re-confirmed against the actual route definitions before being treated as authoritative.

- **Base URL.** `http://localhost:<port>` for development. The concrete port is whatever the server binds to — see [SETUP.md](./SETUP.md) once filled in.
- **Content type.** `application/json` for requests and responses.
- **Auth.** A bearer token in the `Authorization` header. The exact token mechanism (JWT, opaque session token, etc.) is an implementation decision and will be filled in from the auth middleware source.
- **Error shape.** A single envelope across all errors. The exact fields will be filled in from the error middleware source.
- **Versioning.** No URL prefix assumed. Implementation may add one.

## Real-time (push) channel

The implementation will use a push stream for the real-time data path. The specific transport (raw WebSocket, Socket.IO, Server-Sent Events) and the exact event names and payload types are **implementation decisions** and will be sourced from the shared types/events file once `t_e7009f55` lands.

The architectural role of the push channel is described in [ARCHITECTURE.md § 3](./ARCHITECTURE.md#3-the-real-time-data-flow). Once implemented, this section will list each event with direction, name, payload schema, and a usage example.

## Error codes

No error codes are recorded here. They will be sourced from the error middleware / error classes in the server source once `t_4effd51b` lands. Conventionally a MERN app uses a small, stable set keyed by HTTP status and a machine-readable `code` string — but the exact strings are an implementation decision.

## What needs to happen to fill this in

1. `t_e7009f55` (API contract) lands and commits the shared types, JSON Schemas, and Socket.IO event names.
2. `t_4effd51b` (server implementation) lands and commits the route files, controllers, auth middleware, and error middleware.
3. This docs task is re-dispatched. The new run reads every route file, extracts method + path + middleware chain, reads the matching controller for behavior, reads the matching JSON Schema for request shape, and reads the model for response shape, and records them in this file.
4. The "verified by reading source X on date Y" attribution is added per section.
