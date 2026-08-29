# Home Gym Creator — implementation plan index

> Status: active queue.
> Updated: 29 August 2026.
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
- Prove one real model in a minimal 3D scene before producing the complete asset set. Keep that
  vertical slice separate from both full visual production and completion of the 3D preview.
  Landing-page work starts only after the shared-editing demo can provide real screenshots.
- Do not scale a visual pipeline from code or prompts alone. Approve one real mesh benchmark, its
  orthographic top-down render, and a catalog-image comparison before producing the full asset set.
- Treat generated, purchased, and downloaded visual assets as licensed inputs with recorded
  provenance. An unclear license is a rejection, not a later cleanup task.
- Keep the application deployable; routing or deployment-sensitive changes require a production
  build in addition to the canonical local gate.
- Order independent work cheapest first, and place the phase carrying irreversible risk last. Every
  phase boundary must be deployable on its own so that stopping early leaves a coherent product.

## Detailed plans ready to execute

[Phase 16 — Product visual assets and model families](phase-16-product-visual-assets.md) is ready
to execute after the accepted Phase 15 vertical slice. It starts with the adjustable-bench gate,
then builds a modular strength station and a deliberately small set of reusable MVP visual
families.

Phases 17 to 19 were originally drafted as one spatial-semantics phase, and Phase 18 was later split
again into 18a and 18b once it became clear that automatic reachability and named access
requirements answer different questions and carry very different risk. They are split because they
have independent dependencies and very different cost and risk, and because splitting them means an
interrupted queue still leaves a coherent deployable boundary. They are ordered cheapest first, and
the closed rack/bench station template from the original draft is rejected rather than deferred:
demoting the physical-into-use-zone relationship to a warning achieves the same result for every
product pair, and products that ship as one physical unit stay catalog bundles.

Phase 18a is complete: every analysis derives whether doors still reach each other and whether
equipment can still be stood in front of, unreachable entities are errors, and mutations name what
they broke or restored. The walking path is 100 cm. Git history holds the detailed plan.

[Phase 17 — Use-zone semantics and issue severity](phase-17-use-zone-semantics-and-severity.md)
is ready to execute after Phase 16. It renames `clearance` to `useZone`, splits validation results
into errors and warnings so a bench in a rack's working area stops blocking the project, and
introduces `analyzeProject` as the shared read model the later phases extend. No schema change.

[Phase 18b — Access requirements and deterministic routing](phase-18b-access-requirements-and-routing.md)
is next. It reuses the Phase 18a occupancy grid, persists an access requirement as intent, derives the
route deterministically after every mutation, shows it in the plan, adds a stateless `check_access`
question tool, and adds project version 4 through a migration that only appends an empty array. This
is the designated cut line if the deadline tightens.

[Phase 19 — Project items, placement modes, and project v5](phase-19-project-items-and-placement-modes.md)
comes last because it is the heaviest and the only irreversibly risky one. It separates selected
products from floor placements, adds selection-only products, moves budget and coverage onto project
items, and makes one breaking change to `remove_product`.

## Later queue

These phases remain intentionally brief until they reach the front of the queue. Their detailed
plans should use the evidence and decisions produced by earlier work rather than guessing ahead.

| Order | Phase | Depends on | Exit gate |
|---|---|---|---|
| 1 | Phase 20 — 3D room preview completion | Phases 15–17 | The scene shell integrates the completed asset families, placement state, validation presentation, selection, and representative complete-room performance without becoming the editing or validation source of truth. It must degrade cleanly if Phase 18b or 19 was cut. |
| 2 | Phase 21 — WebMCP placement suggestions and batch changes | Phases 17 and 18a | The agent can evaluate hypothetical placements without mutating state, generate deterministic candidates, reject error-producing layouts, score warnings, treat an unreachable entity or a blocked required route as a hard failure, and apply a validated group of layout changes with structured results. |
| 3 | Phase 22 — Shared-editing demo and activity feed | Phases 20 and 21 | The public demo proves the complete human-change → agent-read → agent-change → validation → correction loop in the finished editor and makes tool activity visible. |
| 4 | Phase 23 — Landing page and catalog polish | Phases 16 and 22 | The landing page and catalog match their specifications and use final product assets plus real screenshots and figures from the finished shared-editing demo. |
| 5 | Phase 24 — Submission | Phase 23 | The public URL, repository, English description, sub-three-minute video, and Devpost checklist are complete and verified while logged out. |

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
