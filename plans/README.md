# Home Gym Creator — remaining work

> Updated: 30 August 2026.
> Submission deadline: 3 September 2026, 22:00 CEST.
> Deployment URL: <https://home-gym-coral.vercel.app/> — verify the submitted build in Phase 24.

This directory contains unfinished work only. Remove completed or explicitly cut plans;
Git history preserves them. Implementation evidence belongs in `docs/`.

## Active queue

| Order | Phase | Remaining outcome |
|---|---|---|
| 1 | [Phase 23B — Catalog polish](phase-23b-catalog-polish.md) | Resolve missing-photo presentation and the static catalog sidebar; reconcile documented catalog totals. |
| 2 | [Phase 24 — Submission](phase-24-submission.md) | Verify the deployed shared-editing loop, update README, prepare the English description and video, submit. |

Phase 26 is implemented and locally verified; see [demo evidence](../docs/PHASE_26_DEMO_VERIFICATION.md).
Phase 23A landing is implemented and locally verified; see
[landing evidence](../docs/PHASE_23A_LANDING_VERIFICATION.md).
Its remaining footer-link and public-build/agent/device acceptance is tracked in
[Phase 24's landing release checklist](phase-24-submission.md#landing-release-acceptance).
The demo remains a secondary entry and possible capture source. Phase 23B uses the catalog asset
coverage decisions below. Phase 29 is implemented and locally verified; see
[summary evidence](../docs/PHASE_29_SUMMARY_VERIFICATION.md). It ships the read-only route, 2D/3D,
exact floor metric, JSON export and the three-tool read-only bridge; optional print export is cut.
Phase 24 script preparation can begin once the demo is deployed; final submission depends on
Phase 23B, and its README tool list and demo script must include the shipped summary surface.

## Separate asset work

- [Phase 16 — asset integration and acceptance](phase-16-product-visual-assets.md):
  manifest coverage, bounds decisions, failure handling and room-performance checks remain.
  Browser checks are paused at the user's request; cleanup does not resume them.
- [Remaining catalog photo](phase-16-catalog-images.md): Foundry Bumper Plates only.
  Resume generation at the user's request.
- [Optional catalog proposals](catalog-coverage-priorities.md): unresolved cable-machine,
  dip-bar and other coverage ideas. Not an approved production queue or submission dependency.

## Working rules

- Follow [repository guidance](../AGENTS.md) and its validation ladder: focused tests,
  `quality:quick`, `lint:report`, `agent:verify`, and `build` where required.
- Keep one sequential phase in progress; write its scope, decisions, tasks and exit gate before
  implementation. Update this index when dependencies or scope change.
- Manual editing and WebMCP share one model, command path, validation and undo history.
  3D is primary; 2D and geometric asset fallbacks remain available.
- Use the implemented demo for screenshots and stated figures. Keep unverified device and
  deployment behavior explicit; local tests are not public-build acceptance.
- Keep product dimensions and validation independent of visuals; record asset provenance.
- Do not reopen cut scope: activity feed, named access requirements, visible derived paths,
  `check_access`, or special rack/bench collision exemptions.

## Reference documents

- [Product scope](../docs/PRODUCT_CONCEPT.md)
- [Architecture](../docs/TECHNICAL_ARCHITECTURE.md)
- [Submission requirements](../docs/HACKATHON_REQUIREMENTS.md)
- [WebMCP sources](../docs/WEBMCP_SOURCES.md)
- [Landing specification](../docs/LANDING_PAGE.md)
- [Editor specification](../docs/EDITOR_MOCKUP.md)
- [Visual asset strategy](../docs/PRODUCT_VISUALS_STRATEGY.md)
