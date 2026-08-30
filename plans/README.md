# Home Gym Creator — implementation plan index

> Status: active queue.
> Updated: 30 August 2026.
> Submission deadline: 3 September 2026, 22:00 CEST.
> Live deployment: <https://home-gym-coral.vercel.app/>

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
4. Remove a phase from this index and delete its detailed plan once its exit gate passes or the
   phase is cut. Git history keeps the record; do not turn this file into a completion log.
5. If evidence changes the order or scope, update this index and the affected detailed plans in
   the same change.

## Sequencing rules

- Route manual edits and agent edits through the same domain commands and project store.
- Keep geometry, placement validation, collision detection, and rule checking deterministic.
- The application is already deployed, so order the remaining work by what the judged submission
  needs rather than by internal completeness. Anything a judge touches in a fresh session takes
  precedence over depth hidden behind it.
- Every phase boundary must be deployable on its own so that stopping early leaves a coherent
  product. Keep the live URL working at every boundary.
- Routing, Server/Client Component boundaries, and deployment-sensitive changes require a
  production build in addition to the canonical local gate.
- Treat catalog imagery, top-down editor imagery, and 3D equipment visuals as three distinct
  representations of one catalog product. None of them may become the source of truth for product
  dimensions, placement, clearance, or validation.
- Do not scale a visual pipeline from code or prompts alone. Approve one real mesh benchmark and
  its orthographic top-down render before producing a batch.
- Treat generated, purchased, and downloaded visual assets as licensed inputs with recorded
  provenance. An unclear license is a rejection, not a later cleanup task.
- Landing-page work starts only after the shared-editing demo can provide real screenshots.

## Parallel work

[Phase 16 — remaining visual-asset work](phase-16-product-visual-assets.md) runs separately from
the sequential queue below. Model generation is complete for the selected set; manifest coverage,
bounds decisions, failure coverage and runtime acceptance remain open. Browser checks are paused
at the user's request. Every phase below must work with the permanent geometric fallback.

[Catalog image queue](phase-16-catalog-images.md) contains only Current Fold Bike, Quarry Power
Bar and Foundry Bumper Plates. Resume one product at a time at the user's request.

## Active queue

| Order | Phase | Depends on | Exit gate |
|---|---|---|---|
| 1 | [Phase 26 — Demo bootstrap and creator start modes](phase-26-demo-bootstrap.md) | None | `/creator?start=demo` loads a checked-in demo project in a fresh session with no prior local storage, and `?start=new` opens an empty room instead of restoring a previous session. Both survive a reload and a direct visit. The fixture is built and validated through the same schema and commands as any other project, and it is not a second persistence path. |
| 2 | [Phase 22 — Shared-editing demo and activity feed](phase-22-shared-editing-demo.md) | Phase 26; Phase 21 complete | The public demo proves the complete human-change → agent-read → agent-change → validation → correction loop in the editor and makes tool activity visible to the user in the same interface. |
| 3 | [Phase 23 — Landing page and catalog polish](phase-23-landing-catalog-polish.md) | Phases 16 and 22 | The landing page and catalog match their specifications and use final product assets plus real screenshots and figures from the finished shared-editing demo. |
| 4 | [Phase 24 — Submission](phase-24-submission.md) | Phase 23 | The live URL is verified logged out and in a fresh WebMCP session, the repository README carries the demo URL, tool list, sample prompts, WebMCP testing instructions, and architecture, and the English description and sub-three-minute video complete the Devpost checklist. |

The live URL already satisfies the hosting part of Phase 24, so that phase is now documentation,
description, and video rather than infrastructure. Verify tool registration against the deployed
build in a fresh WebMCP session before relying on it in the video.

## Global exit gate

Every implementation phase must satisfy the repository validation ladder:

- changed behavior has proportionate tests,
- `npm run quality:quick` passes during the phase,
- `npm run agent:verify` passes before the phase is complete,
- `npm run build` also passes for routing, Server/Client Component boundaries, Next.js
  configuration, build behavior, or deployment-sensitive changes,
- no non-test source or configuration file exceeds 500 physical lines,
- the public demo remains openable.

## Scope boundary

The MVP does not include accounts, a database, checkout, real prices, in-app model calls,
server-side photo analysis, irregular room outlines, arbitrary rotation angles, photorealistic 3D
models for every product, or a global layout solver. Reopen this boundary only through an explicit
product decision.

Named access requirements, the visible derived route, and a `check_access` tool are **cut**, not
deferred. They were drafted as Phase 18b. The Phase 18a walkability guarantee already makes an
unreachable entity an error, so the named-route layer adds a schema migration and a routing
presentation layer without changing any judged outcome. The closed rack/bench station template
from the same original draft stays rejected: demoting the physical-into-use-zone relationship to a
warning achieves the same result for every product pair, and products that ship as one physical
unit stay catalog bundles. Reopening either requires an explicit product decision and a new plan.

## Related documents

- [Product concept](../docs/PRODUCT_CONCEPT.md)
- [Technical architecture](../docs/TECHNICAL_ARCHITECTURE.md)
- [Hackathon requirements](../docs/HACKATHON_REQUIREMENTS.md)
- [WebMCP sources](../docs/WEBMCP_SOURCES.md)
- [Landing page specification](../docs/LANDING_PAGE.md)
- [Editor mockup specification](../docs/EDITOR_MOCKUP.md)
- [Product visuals strategy](../docs/PRODUCT_VISUALS_STRATEGY.md)
- [Visual mockups](../docs/mockups)
