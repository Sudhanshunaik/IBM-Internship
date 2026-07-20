# Standard Operating Procedure — New Developer Onboarding

> **DRAFT — review before use. This document is a stub.** The task acceptance criterion is that the SOP must let a new developer "clone, configure, and run the full stack locally in under 15 minutes." That requires running the steps on a clean machine and timing them. The implementation does not yet exist. The 15-minute runbook below is an outline of what the verified SOP will contain, with explicit placeholders for the values that must come from real measurement.

## Goal

A new engineer clones the repo, follows this runbook, and has the full MERN 3D Visualization Platform running locally — with a logged-in session, a 3D scene, and at least one data point visible in the Three.js renderer — in under 15 minutes.

## What the runbook will contain

| Section | What goes here | Source |
|---|---|---|
| 0:00 — Clone | Repository URL (placeholder: `<repo-url>`) | The implementation's repository |
| 0:30 — Tooling check | `node -v`, `npm -v`, Mongo reachability — with the exact minimum versions | Root `package.json` `engines`, MongoDB connection check |
| 1:00 — Install | `npm install` (or whatever the implementation uses) | Root `package.json` `scripts` |
| 3:00 — Configure `.env` | Copy `.env.example`, set `MONGO_URI`, generate secrets | `.env.example` once `t_e7009f55` lands |
| 4:00 — Start Mongo | Local start command or Atlas confirmation step | Implementation choice |
| 4:30 — Start server | Dev command, expected first log line, port to confirm | `server/package.json`, server entry point |
| 6:00 — Start client | Dev command, URL to open, expected first-paint signal | `client/package.json`, Vite/React config |
| 7:00 — Health probe | `curl` against the health endpoint, expected response | Route file once `t_4effd51b` lands |
| 8:00 — Create account | `POST /api/auth/register` with a sample body, save the access token | Auth route + schema once `t_4effd51b` lands |
| 9:00 — Create scene | `POST /api/scenes` with a sample body | Scenes route + schema once `t_4effd51b` lands |
| 10:00 — Create data source | `POST /api/datasources` with a sample body | Data sources route + schema once `t_4effd51b` lands |
| 11:00 — Push a data point | `POST /api/datapoints` with a sample body | Data points route + schema once `t_4effd51b` lands |
| 12:00 — Confirm live update | Subscribe over the push channel, confirm a `datapoint:*` event arrives | Real-time transport once implementation lands |
| 13:00 — Run the tests | `npm test` (or implementation's test command) | Root `package.json` |
| 14:00 — Tear down | `Ctrl+C`, confirm clean shutdown | Implementation behavior |
| 15:00 — Done | You are ready to pick up a ticket | n/a |

## Why the runbook is not filled in

Each numbered step needs **two pieces of information that only exist after the implementation lands**:

1. The exact command or request to run.
2. A success criterion the new developer can verify themselves (an HTTP status, a log line, a UI signal).

Inventing either of these — for example, picking a port like `4000` or an error envelope shape like `{"error":{"code":...}}` — would be a guess. A new developer who followed that guess would either silently do the wrong thing or hit a confusing failure on their first day. The verified runbook is more valuable than a plausible one.

## Verification log

| Date | Verified by | Result | Notes |
|---|---|---|---|
| 2026-06-26 | `documents` (current run) | **Not run** | The implementation does not exist. The runbook is an outline with explicit placeholders. Re-dispatch this task after `t_e7009f55`, `t_4effd51b`, and `t_8af65358` land to fill in the values from the real code and walk through the steps on a clean machine. |

## What needs to happen to fill this in

1. The implementation tasks land.
2. A clean machine (or a fresh container) is provisioned with the prerequisite toolchain.
3. The steps are walked through with a stopwatch. Each "what done looks like" is recorded verbatim from the actual output of the real commands.
4. The "Verified on clean machine in N minutes" badge is added to the top of this file, with the date and the verifier.
5. Any step that exceeds its slot is re-thought (pre-bundle, pre-fetch, simplify, or move to a separate advanced runbook).
