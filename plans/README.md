# Home Gym Creator — implementation plan index

> Status: active queue.
> Updated: 28 August 2026.
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
- Treat catalog imagery, top-down editor imagery, and 3D equipment visuals as three distinct
  representations of one catalog product. None of them may become the source of truth for product
  dimensions, placement, clearance, or validation.
- Establish equipment placement with replaceable visuals before producing the final asset pack;
  then reuse the same placement state in both the 2D plan and the 3D preview.
- Keep production of product models and integration of the 3D room preview in separate dedicated
  phases. Landing-page work starts only after the shared-editing demo is complete and can provide
  real screenshots.
- Keep the application deployable; routing or deployment-sensitive changes require a production
  build in addition to the canonical local gate.

## Detailed plans ready to execute

No detailed implementation plan is currently active. Phase 12 is next in the queue and should be
expanded against the completed catalog and the existing room, persistence, and WebMCP contracts.

## Later queue

These phases remain intentionally brief until they reach the front of the queue. Their detailed
plans should use the evidence and decisions produced by earlier work rather than guessing ahead.

| Order | Phase | Depends on | Exit gate |
|---|---|---|---|
| 1 | Phase 12 — Equipment placement foundation | Phases 6, 7, 9, 10, and 11 | Catalog equipment can be placed, selected, moved, rotated, and removed in the 2D plan as deterministic geometric figures; collision, clearance, height, and budget validation passes; placements survive undo/redo, persistence, and import/export. Final product imagery and models are not required. |
| 2 | Phase 13 — Product visual assets and models | Phases 11 and 12 | Reusable procedural equipment families provide recognizable simplified 3D models, transparent top-down editor assets, and coherent catalog renders mapped by stable product ID, with geometric fallbacks and no effect on validation. |
| 3 | Phase 14 — 3D room preview | Phases 12 and 13 | The editor can switch from the primary 2D plan to a navigable 3D room preview that integrates the Phase 13 models with walls, openings, and obstacles from the same project state; validation remains based on deterministic catalog geometry. |
| 4 | Phase 15 — WebMCP placements and suggestions | Phases 8 and 12 | The agent can place and revise equipment using deterministic candidate generation and structured validation results. |
| 5 | Phase 16 — Shared-editing demo and activity feed | Phases 14 and 15 | The public demo proves the complete human-change → agent-read → agent-change → validation → correction loop in the finished editor and makes tool activity visible. |
| 6 | Phase 17 — Landing page and catalog polish | Phases 13 and 16 | The landing page and catalog match their specifications and use final product assets plus real screenshots and figures from the finished shared-editing demo. |
| 7 | Phase 18 — Submission | Phase 17 | The public URL, repository, English description, sub-three-minute video, and Devpost checklist are complete and verified while logged out. |

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
server-side photo analysis, irregular room outlines, arbitrary rotation angles, photorealistic 3D
models for every product, or a global layout solver. Reopen this boundary only through an explicit
product decision.

## Related documents

- [Product concept](../docs/PRODUCT_CONCEPT.md)
- [Technical architecture](../docs/TECHNICAL_ARCHITECTURE.md)
- [Hackathon requirements](../docs/HACKATHON_REQUIREMENTS.md)
- [WebMCP sources](../docs/WEBMCP_SOURCES.md)
- [Landing page specification](../docs/LANDING_PAGE.md)
- [Editor mockup specification](../docs/EDITOR_MOCKUP.md)
- [Product visuals strategy](../docs/PRODUCT_VISUALS_STRATEGY.md)
- [Visual mockups](../docs/mockups)
