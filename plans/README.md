# Home Gym Creator — remaining work

> Updated: 30 August 2026.
> Recorded submission deadline: 3 September 2026, 22:00 CEST; recheck official requirements before release.
> Deployment URL: <https://home-gym-coral.vercel.app/> — verify the submitted revision.

Plans describe unfinished outcomes; docs describe current contracts, constraints, sources and
reproducibility. Remove completed or explicitly cut plans after updating the authoritative docs.
Git preserves history; routine verification belongs in the task, PR or CI record.

## Active queue

| Order | Plan | Remaining outcome |
|---|---|---|
| 1 | [Catalog polish](phase-23b-catalog-polish.md) | Remove or repurpose the static project-summary sidebar; verify the retained catalog presentation. |
| 2 | [Submission](phase-24-submission.md) | Verify the final deployed shared-editing loop and summary, finish judge-facing README, description/video and submission. |

Submission script preparation and public-build checks can start before catalog polish finishes;
final submission depends on it. The submission plan owns landing, demo, editor, workspace and
summary release checks. Local implementation or past checks do not establish public acceptance.

## Separate asset work

[Asset integration and acceptance](phase-16-product-visual-assets.md) retains manifest coverage,
bounds decisions, loader-failure integration and complete-room performance checks. Asset browser
review remains paused at the user's request; cleanup does not resume it. Kettlebell refinement is
stopped. There is no open photo or new-product production queue: the active catalog has 23 mapped
photos, for 21 placeable products and two selection-only accessories.

## Working rules

- Follow [repository guidance](../AGENTS.md) and its validation ladder. Persist detailed
  implementation plans here before changing behavior; update this index when scope changes.
- Keep one sequential implementation phase in progress. Separate asset acceptance does not
  automatically become a submission blocker; disclose any limits in submission claims.
- Manual editing and WebMCP share one model, command path, validation and undo history.
  3D is primary; 2D and geometric asset fallbacks remain available.
- Use the implemented demo for screenshots and stated figures. Keep unverified device and
  deployment behavior explicit, and tie release evidence to the submitted revision.
- Keep product dimensions and validation independent of visuals; preserve asset provenance.
- Do not reopen cut scope: activity feed, named access requirements, visible derived paths,
  `check_access`, special rack/bench collision exemptions, or summary PDF/print/share export.

## Reference documents

- [Product scope](../docs/PRODUCT_CONCEPT.md)
- [Architecture](../docs/TECHNICAL_ARCHITECTURE.md)
- [Submission requirements](../docs/HACKATHON_REQUIREMENTS.md)
- [WebMCP sources](../docs/WEBMCP_SOURCES.md)
- [Landing specification](../docs/LANDING_PAGE.md)
- [Editor specification](../docs/EDITOR_MOCKUP.md)
- [Visual asset strategy](../docs/PRODUCT_VISUALS_STRATEGY.md)
