# Phase 29 — Project summary

> New phase. Runs after [Phase 23B](phase-23b-catalog-polish.md) and before
> [Phase 24](phase-24-submission.md), because the README tool list and the demo script must describe
> the surface that actually ships. Hard deadline pressure: submission closes 3 September 2026,
> 22:00 CEST, so this phase is timeboxed and carries an explicit cut list.
> Layout reference: `docs/mockups/home-gym-project-summary-v1.png` (Polish labels in the mockup are
> layout placeholders; the product ships in English).

## Problem

The creator can build and validate a layout, but the session has no ending. A person finishes
arranging a room and the product gives them no place that answers the questions the whole exercise
was for: what am I buying, what does it cost against my budget, are my training goals covered, is the
layout actually valid, and how do I take this away with me. The application behaves like a shop
without a basket view.

Everything needed to answer those questions already exists in the domain layer and is recomputed on
every mutation — `ProjectAnalysis` carries per-item prices, training-goal coverage, and every
validation issue — but it is only exposed as a collapsible "Layout checks" panel in the editor
sidebar. There is no summary route, no entry point to one, and no `get_project_summary` tool, even
though `docs/PRODUCT_CONCEPT.md` and `docs/TECHNICAL_ARCHITECTURE.md` both name that tool as part of
the product.

## Scope

In scope: a read-only project summary surface, the navigation into and out of it, a deterministic
summary derivation shared by the UI and WebMCP, a `get_project_summary` tool, read-only 2D and 3D
viewports for the finished layout, and reuse of the existing JSON export.

Out of scope: any change to editing behaviour, commands, or the store contract; multi-project storage
or project naming; a shareable server-persisted summary URL; PDF or image export via a new
dependency; a live project summary in the server-rendered catalog sidebar (owned by
[Phase 23B](phase-23b-catalog-polish.md), which cuts that placeholder); checkout, ordering, retailer
links or any real commerce; new catalog products or assets.

## Decisions

**D1 — one derivation, two surfaces.** A single pure function
`buildProjectSummary(project, analysis, resolveProduct)` in `src/features/project/summary/` produces
the entire summary payload. The page renders that payload and the WebMCP tool serializes it. No
total, count, ratio or status string is computed inside JSX, and the agent cannot read numbers that
differ from the ones on screen. This is the same invariant as the shared command path, applied to
reporting.

**D2 — the summary is a route, not a modal.** `/summary` is a client surface that restores the same
single localStorage slot through the existing `ProjectPersistenceBoundary` (mounted without
`startMode`) and never dispatches. Rationale: the mockup is a destination with its own navigation, a
route keeps the already large editor composition from growing, and it gives the demo and the judges
an addressable surface. There is no project id and no server persistence, so the route is
session-local by construction; do not invent an id scheme in this phase.

**D3 — read-only viewports are new thin components, not new props on the editors.** `RoomPlan` is
400 lines and wires pointer, drag and drop handling into every entity; adding a read-only mode to it
risks the 500-line limit and the editor's behaviour. Build `SummaryRoomPlan` from the existing
building blocks — `createPlanTransform`, `EquipmentEntity`, `ObstacleEntity`, `WallElementEntity`
with `interactive={false}` — and `SummaryScene` as a plain `Canvas` around `SceneContents` and
`SceneCameraControls`, with no picking, ghost, wall targets or editing controller. Keep the existing
2D fallback behaviour when the 3D context fails.

**D4 — every tile is backed by deterministic domain data, or it is cut.** Products, cost, remaining
budget, collisions, goal coverage and the validation checklist all map to existing analysis output.
Free floor percentage is the one metric that does not exist yet. Implement it as a tested geometry
function with a written definition — room floor area minus the union of placed equipment footprints,
obstacle footprints and wall-element floor intrusions, divided by room floor area — or drop the tile.
Do not approximate a headline number in a component.

**D5 — English copy; the mockup is layout reference only.** The PNG is Polish because it is a sketch.
Ship English strings, reuse `formatPricePln` and the existing catalog formatters, and keep prices in
PLN as the catalog already does.

**D6 — export reuses what exists.** "Export project" is the existing JSON export from
`ProjectFileActions`. The mockup's "Download summary" is at most `window.print()` behind a print
stylesheet, and it is the first item on the cut list. No PDF library, no canvas screenshot, no new
dependency.

**D7 — validation copy is shared, not duplicated.** `describeValidationIssue` currently lives inside
the client component `validation-summary.tsx`. Extract it to its own module and import it from both
the creator panel and the summary, so the two surfaces cannot drift.

**D8 — minimal entry points.** Into the summary: one primary action in the creator toolbar. Out of
it: "Back to editing" and "Export project" in the summary toolbar. Nothing on the landing page and
nothing in the catalog in this phase.

**D9 — an empty project gets an empty state, not zeros.** If the restored project has no project
items, the page shows a short empty state linking into the creator instead of a summary full of
zeros. Detect this from project content, not from persistence status.

## Implementation tasks

1. **Summary derivation.** Add `src/features/project/summary/project-summary.ts` exporting
   `ProjectSummary` and `buildProjectSummary`. Payload shape, all derived from `GymProject` plus
   `ProjectAnalysis`:
   - `room`: dimensions and floor area.
   - `items[]`: project item id, product id and name, a short use label from the product's training
     goals or exercises, dimensions, price, whether it is placed, and its blocking issue codes.
   - `totals`: item count, total price, budget, remaining or excess, over-budget flag.
   - `coverage`: requested, covered and uncovered training goals, straight from `analysis.coverage`.
   - `checks[]`: the mockup's validation checklist as stable ids with pass/fail derived from issue
     codes — physical collisions, use zones respected, everything inside the room, budget respected,
     access evaluated.
   - `recommendations[]`: warning-severity issues rendered through the shared describe function.
   - `floor`: occupied and free area plus free ratio, subject to task 2.
   - Counters: `valid`, `errorCount`, `warningCount`.

2. **Free floor metric.** Add the geometry function next to the existing footprint and occupancy
   code, with unit tests covering an empty room, a room with obstacles, and overlapping footprints
   counted once. If it does not land cleanly inside the timebox, remove the tile and the `floor`
   field rather than shipping an estimate.

3. **Shared issue description.** Extract `describeValidationIssue` and its access helper out of
   `src/features/creator/components/validation-summary.tsx` into a dedicated module, update the
   creator import, and keep the existing tests passing unchanged.

4. **Route and shell.** Add `src/app/summary/page.tsx` as a server page wrapping a client entry in
   `<Suspense>`, mounting `ProjectPersistenceBoundary` without `startMode` and rendering the summary
   view. Add `routes.summary` and the corresponding links in `src/lib/navigation.ts`. Update
   `src/components/site-chrome.tsx`, which currently hides the global header only on the exact
   `/creator` path, so the summary renders its own application toolbar instead of the marketing
   header. The toolbar carries the brand mark, a breadcrumb into the creator, a catalog link,
   "Export project" and "Back to editing", mirroring the mockup's header.

5. **Summary UI.** Build the view from small components under `src/features/summary/components/`,
   each well under the file-size limit and using the existing `Card`, `Button`, `LinkButton` and
   tokens: page header with the validity badge, layout card with the 2D/3D toggle and legend,
   equipment table with a total row, result card with cost, budget bar and metric tiles, goal
   coverage list, validation checklist with recommendations, and the local-save footer status.

6. **Read-only viewports.** Implement `SummaryRoomPlan` and `SummaryScene` per D3, plus the 2D/3D
   toggle. Default to 2D on the summary — it reads as a document and avoids paying the 3D cost on a
   page people may open on a phone — and fall back to 2D when the scene fails.

7. **Entry point in the creator.** Add the primary "View summary" action to `CreatorToolbar` next to
   `ProjectFileActions`. It navigates to `/summary`; the autosave subscription already persists the
   current project, so no explicit save step is needed.

8. **WebMCP parity.** Add `get_project_summary` as a read-only tool: a handler and serializer beside
   the existing `room-tool-handlers.ts` and `room-tool-results.ts`, wired into
   `createRoomWebMcpTools`, returning the D1 payload rather than raw geometry. Add a summary bridge
   that registers the read-only subset — `get_project_summary`, `get_project_state`,
   `validate_layout` — on `/summary`, following the catalog bridge pattern, so an agent on that page
   is not toolless.

9. **Documentation.** Record evidence in `docs/PHASE_29_SUMMARY_VERIFICATION.md`. Move
   `get_project_summary` from planned to implemented in `docs/TECHNICAL_ARCHITECTURE.md` and
   `docs/PRODUCT_CONCEPT.md`. Note in [Phase 24](phase-24-submission.md) that the README tool list
   and the demo script must include the summary surface.

## Acceptance criteria

- From the creator, one visible action reaches the summary, and the summary returns to the creator
  with the project unchanged.
- Every number on the page comes from `buildProjectSummary`, and `get_project_summary` returns the
  same figures for the same project state.
- The equipment list shows every project item with its price and placement status, and the total
  matches the sum of item prices used by budget validation.
- Cost, remaining budget, goal coverage and the validation checklist agree with the creator's
  "Layout checks" panel for the same project, including the over-budget case.
- The layout renders read-only in both 2D and 3D, no interaction mutates the project, and a scene
  failure falls back to 2D.
- Opening `/summary` with no saved project shows the empty state and a link into the creator, with no
  zero-filled tiles.
- Reloading `/summary` after editing shows the edited project; the summary never writes to storage.
- "Export project" downloads the same JSON as the creator's existing export.
- The page is readable at phone, tablet and desktop widths, keyboard reachable, and the validity
  badge and status regions are announced.
- No non-test source file exceeds 500 lines.

## Tests

- `src/features/project/summary/project-summary.test.ts` — totals, remaining versus excess budget,
  coverage counts, checklist pass/fail per issue code, unplaced items, and a project with an
  unavailable product.
- Geometry test for the free floor function per task 2.
- `src/features/webmcp/room-tool-handlers.test.ts` — extend for `get_project_summary`, asserting the
  serialized payload matches `buildProjectSummary` for the demo project.
- A jsdom test for the summary view rendering the demo project: item rows, total, coverage ratio,
  checklist, and the empty state for a project with no items.
- A jsdom test asserting the read-only viewport dispatches nothing on click and drag.
- Extend `src/features/project/demo-project.test.ts` only if the demo project's expected summary
  figures become an anchor for the demo script.

## Manual checks

In a private window with no prior storage: open `/summary` cold and confirm the empty state; run
`/creator?start=demo`, reach the summary from the toolbar, and compare every figure against the
editor's checks panel; make the demo project over budget and confirm the cost block and checklist
change; toggle 2D and 3D; export the JSON and re-import it in the creator; repeat at phone width.
With the WebMCP flag enabled, confirm the summary page registers its read-only tools and that
`get_project_summary` returns what the page shows.

## Risks and cut list

The schedule is the dominant risk: this phase sits between catalog polish and submission with roughly
three days of runway, and Phase 24 needs its media time. Reuse of the scene stack is the second risk
— if a plain `Canvas` around `SceneContents` misbehaves outside the editor, ship 2D only rather than
debugging the renderer this late.

Cut in this order if time runs short: the print/download action, the 3D viewport, the free floor
tile, the summary-page WebMCP bridge. The minimum shippable surface is the route, the entry and exit
actions, the equipment list with totals against budget, goal coverage, the validation checklist, the
read-only 2D plan, and the `get_project_summary` tool.

## Exit gate

All acceptance criteria hold or their scope is explicitly cut here, `npm run agent:verify` passes,
and `npm run build` passes because a new route and Server/Client boundary were added. Delete this
file and its index row afterwards, and record verification evidence in `docs/`.
