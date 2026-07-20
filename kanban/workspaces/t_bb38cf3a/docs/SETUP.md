# Setup & Run Guide

> **DRAFT — review before use. This document is a stub.** The acceptance criterion for this task requires the setup guide to "actually work when followed from a clean machine." The implementation does not yet exist (`t_4effd51b` and `t_8af65358` are `todo`). The structure below describes what a setup guide for a MERN + real-time + Three.js prototype conventionally contains, but **none of the specific install / dev / start commands in this file have been verified** — they will be filled in from the actual `package.json` files once the implementation lands, and then verified by following the steps on a clean machine.

## What the implementation will provide

| Item | Source of truth | Filled in when |
|---|---|---|
| Node.js version requirement | `engines` field in the root `package.json` | `t_e7009f55` or `t_4effd51b` |
| MongoDB version requirement | README or contributing guide of the implementation | Implementation lands |
| Required environment variables | `.env.example` at the repo root and/or `server/.env.example` | `t_e7009f55` |
| Install command | Root `package.json` scripts | Implementation lands |
| Dev command (server) | `server/package.json` | `t_4effd51b` lands |
| Dev command (client) | `client/package.json` | `t_8af65358` lands |
| Build command | Root and per-workspace `package.json` | Implementation lands |
| Test command | Root and per-workspace `package.json` | Implementation lands |
| Default ports | Server entry point and Vite/React client config | Implementation lands |

## Conventional prerequisites for a MERN + Three.js prototype

These are baseline assumptions, **not** sourced from any specific package.json because none exists yet. They will be re-validated when the implementation lands.

- **Node.js.** A recent LTS (≥ 18 or ≥ 20 — the implementation will pin the exact version).
- **npm** (or pnpm / yarn — the implementation will pick the package manager).
- **MongoDB.** Either a local install or a connection string to MongoDB Atlas. The exact URI format will be in the implementation's `.env.example`.
- **Two free ports.** One for the server (conventionally `4000` for an Express app), one for the client dev server (conventionally `5173` for Vite or `3000` for Create React App). The actual ports will be filled in from the implementation.
- **Git** to clone the repository.

## Steps the SOP will walk through (high level)

1. Clone the repository.
2. Install dependencies at the workspace root.
3. Copy `.env.example` to `.env` and fill in the values.
4. Start MongoDB (local) or confirm the Atlas URI is reachable.
5. Start the server.
6. Start the client.
7. Open the client URL in a browser and confirm the app loads.

Each step needs a **"what done looks like"** success criterion, which is what the SOP records. The SOP at [SOP.md](./SOP.md) is currently a stub.

## What needs to happen to fill this in

1. The implementation tasks land and commit the actual `package.json` files, `.env.example`, server entry point, and client dev server config.
2. The setup steps are walked through on a clean machine and timed. Each step's success criterion is recorded from the actual behavior (e.g. "the server logs `Listening on :4000`" — verbatim from the real log output, not a guess).
3. The SOP's "verified on clean machine" badge is added to [SOP.md](./SOP.md).
