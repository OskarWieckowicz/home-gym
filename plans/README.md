# Home Gym Creator — implementation plan index

> Status: active queue.
> Updated: 27 August 2026.
> Submission deadline: 3 September 2026, 22:00 CEST.

This document is the entry point for implementation work. It keeps the remaining phases in
dependency order and links to executable plans in this directory. Completed phases and their
detailed plan files are intentionally removed; Git history remains the record of completed work.

Product scope and architecture live in the [product concept](../docs/PRODUCT_CONCEPT.md) and
[technical architecture](../docs/TECHNICAL_ARCHITECTURE.md). This index should not duplicate them.

## How to use this index

1. Work from the top of the active queue and keep only one implementation phase in progress.
2. Before starting a phase, create its detailed plan in `plans/phase-NN-short-name.md` if it does
   not already exist.
3. A detailed plan must name its dependencies, scope boundary, implementation tasks, acceptance
   criteria, tests, manual checks, and exit gate.
4. Remove a phase from this index and delete its detailed plan once its exit gate passes. Git
   history keeps the implementation record; do not turn this file into a completion log.
5. If evidence changes the order or scope, update this index and the affected detailed plans in
   the same change.

## Sequencing rules

- Learn WebMCP on the small, read-only catalog surface before connecting it to mutable room state.
- Treat a real tool call from a supported agent environment as a hard gate before building the
  room domain on top of unverified WebMCP assumptions.
- Route manual edits and agent edits through the same domain commands and project store.
- Keep geometry, placement validation, collision detection, and rule checking deterministic.
- Keep the application deployable; routing or deployment-sensitive changes require a production
  build in addition to the canonical local gate.

## Detailed plans ready to execute

| Order | Phase | Detailed plan | Exit gate |
|---|---|---|---|
| 1 | Phase 2 — Minimal catalog | [Phase 2 plan](./phase-02-minimal-catalog.md) | The catalog schema, seed data, browse page, filters, and product detail routes pass tests and a production build. |
| 2 | Phase 3 — WebMCP theory | [Phase 3 plan](./phase-03-webmcp-theory.md) | `WEBMCP_SOURCES.md` contains a current, source-backed implementation contract and resolves or records every question that blocks Phase 4. |

Phase 3 follows Phase 2 to limit work in progress, although its research does not depend on
catalog code.

## Later queue

These phases remain intentionally brief until they reach the front of the queue. Their detailed
plans should use the evidence and decisions produced by earlier work rather than guessing ahead.

| Order | Phase | Depends on | Exit gate |
|---|---|---|---|
| 3 | Phase 4 — Read-only WebMCP over the catalog | Phases 2 and 3 | `search_products` and `get_product_details` are registered per page, runtime-validated, tested, and visibly unavailable only through a clear fallback. |
| 4 | Phase 5 — Agent verification and public deployment | Phase 4 | The deployed tools are discovered and successfully called from the supported judge environment after a fresh load. This is a hard gate. |
| 5 | Phase 6 — Room domain core | Phase 5 | Schemas, deterministic geometry, commands, store, validation, and undo/redo pass focused tests without UI dependencies in the domain layers. |
| 6 | Phase 7 — Manual room editor | Phase 6 | A person can configure and edit the room and obstacles on the 2D plan, with all mutations flowing through `dispatch(command)`. |
| 7 | Phase 8 — WebMCP for the room | Phase 7 | The agent can read, configure, and validate the same room state and history used by manual editing. |
| 8 | Phase 9 — Catalog depth | Phases 2 and 8 | The catalog covers the full planned product range and filtering fields with complete spatial and training data. |
| 9 | Phase 10 — Equipment in the room | Phases 6, 7, and 9 | Catalog equipment can be placed and validated against collisions, clearance, height, and budget, with persistence and import/export. |
| 10 | Phase 11 — WebMCP placements and suggestions | Phases 8 and 10 | The agent can place and revise equipment using deterministic candidate generation and structured validation results. |
| 11 | Phase 12 — Shared-editing demo and activity feed | Phase 11 | The public demo proves the complete human-change → agent-read → agent-change → validation → correction loop and makes tool activity visible. |
| 12 | Phase 13 — Landing page and catalog polish | Phase 12 | Both surfaces match their specifications and use real screenshots and figures from the finished demo project. |
| 13 | Phase 14 — Submission | Phase 13 | The public URL, repository, English description, sub-three-minute video, and Devpost checklist are complete and verified while logged out. |

## Global exit gate

Every implementation phase must satisfy the repository validation ladder:

- changed behavior has proportionate tests,
- `npm run quality:quick` passes during the phase,
- `npm run agent:verify` passes before the phase is complete,
- `npm run build` also passes for routing, Server/Client Component boundaries, Next.js
  configuration, build behavior, or deployment-sensitive changes,
- no non-test source or configuration file exceeds 500 physical lines,
- the public demo remains openable once deployment exists.

## Scope boundary

The MVP does not include accounts, a database, checkout, real prices, in-app model calls,
server-side photo analysis, irregular room outlines, arbitrary rotation angles, or a global layout
solver. Reopen this boundary only through an explicit product decision.

## Related documents

- [Product concept](../docs/PRODUCT_CONCEPT.md)
- [Technical architecture](../docs/TECHNICAL_ARCHITECTURE.md)
- [Hackathon requirements](../docs/HACKATHON_REQUIREMENTS.md)
- [WebMCP sources](../docs/WEBMCP_SOURCES.md)
- [Landing page specification](../docs/LANDING_PAGE.md)
- [Editor mockup specification](../docs/EDITOR_MOCKUP.md)
- [Visual mockups](../docs/mockups)
