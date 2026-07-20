# Project Documentation Index

> **DRAFT — review before use.** This package is a forward-looking specification, not documentation of an existing codebase. The implementation tasks (`t_e7009f55` API contract, `t_4effd51b` backend, `t_8af65358` frontend) are still `todo` at the time of writing. Every endpoint, schema, and command in the linked documents is a **proposal to be confirmed against the actual source code once it lands** — do not treat them as the authoritative API surface.

## What is in this package

| File | Status | What it is |
|---|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Forward-looking spec | One-page system overview derived from the parent task body ("MERN stack, real-time API data, Three.js 3D visualization"). High-level topology, REST vs. push-stream split, and where Three.js plugs in. No claim is sourced from code that does not yet exist. |
| [API.md](./API.md) | **Stub only** | Endpoint table is intentionally empty. Endpoint shapes must be generated from the route definitions in `t_4effd51b` once the backend lands. This file currently lists the categories of endpoints the API is expected to expose and the conventions the parent task implies (REST + real-time push). |
| [SETUP.md](./SETUP.md) | **Stub only** | Structure and prerequisites are described at a generic MERN level. Specific install/dev/start commands **must be verified by running them on a clean machine after the implementation lands** — see SOP § Verification. |
| [SOP.md](./SOP.md) | **Stub only** | 15-minute onboarding runbook structure. The acceptance criterion "actually works when followed from a clean machine" cannot be honestly satisfied until the code exists; the SOP is therefore an outline, not a verified runbook. |

## Why the docs are not more detailed

The task body specifies:

> We are prototyping a new full-stack application. The architecture relies on a MERN stack infrastructure, integrating real-time API data, and features a primary frontend interface built with Three.js for 3D visualizations.

The deliverables (API reference, setup guide, SOP with verification) all require a real implementation to source from. Per the kanban worker guardrails, fabricating endpoint paths, request/response shapes, error codes, or npm workspace commands in place of reading them from the source would be dishonest — it would look like documentation but would be a guess. The implementation tasks will produce the real artifacts; this task's value is the structural shell and the clearly-flagged gaps.

## Doc-to-task traceability

| Doc | Will be filled in by |
|---|---|
| `ARCHITECTURE.md` | Largely already complete; delta updates after `t_e7009f55` lands the shared types/schemas package. |
| `API.md` | The route definitions committed by `t_4effd51b` (server implementation). The shared event names in `t_e7009f55`. |
| `SETUP.md` | The actual `package.json` scripts from the implementation. The actual `.env.example` from `t_e7009f55`. |
| `SOP.md` | A clean-machine run after `t_4effd51b` and `t_8af65358` both complete. |

## Recommended next step

A reviewer should:

1. **Decide on the dependency chain.** This task has no parent linking it to `t_e7009f55` / `t_4effd51b` / `t_8af65358`. The cleanest fix is to add those as parents so this task auto-promotes to `ready` only after the implementation exists. Then the dispatcher re-runs this task with real code to source from.
2. **Or accept this scaffold as a working baseline** and re-dispatch this task later to fill in the stubbed sections.

The current run intentionally did not invent the missing detail.
