# Phase 16 — Remaining visual-asset work

> Updated: 30 August 2026. Integration and acceptance only; no new asset production queue.
> Asset browser review remains paused. Kettlebell refinement remains stopped.

## Scope and constraints

Finish the asset audit and integration checks using the existing
[runtime registry](../src/features/creator/scene/visual-assets.ts), [generators](../scripts/) and
[assets](../public/assets/). Follow the [visual strategy](../docs/PRODUCT_VISUALS_STRATEGY.md)
and [architecture](../docs/TECHNICAL_ARCHITECTURE.md).

- Catalog data owns dimensions, placement, clearance and prices. Asset changes must not change
  domain geometry or saved poses. GLBs use metres, a centered floor pivot and negative-Z forward.
- The strength-station bundle is one placement; independent products receive no nesting or
  collision exemption. Retain geometric fallbacks, including those used by legacy projects.
- All 23 active catalog products have mapped photos: 21 placeable and two selection-only.
  There is no missing-photo queue. Deterministic top SVGs remain the MVP 2D assets; multi-angle
  capture sets, new SKUs, sourced meshes, animation and physics remain outside this plan.

## Remaining tasks

1. **Complete the manifest.** Record each catalog product as an explicit family/variant or
   intentional visual fallback, distinguishing selection-only products that need no model.
   Link registered models to generators, outputs, provenance and measured budgets. Validate IDs,
   unique paths, file existence and registry agreement; preserve legacy fallback coverage.
   Keep durable metadata outside plans and screenshot logs. Existing mapping/photo tests are a
   starting point, not tasks to reproduce.
2. **Audit actual bounds against catalog envelopes.** Include runtime scale and displayed pose.
   Resolve Summit's source/runtime envelope discrepancy and its family reference dimensions;
   check the existing Northstar variant against the result rather than proposing it as new work.
   Record accepted exceptions without changing catalog dimensions to fit a mesh. Target at most
   3 cm envelope overrun and 1 cm floor/origin error; larger deviations need a recorded decision.
   Arc's inclined backrest extending above catalog seat height is an accepted visual exception.
3. **Complete loader-failure integration coverage.** Isolated missing/invalid-asset boundaries,
   healthy siblings and selected fallbacks already have tests. Verify actual loader failures
   preserve per-placement fallbacks through editing, validation, WebMCP and undo/redo; do not
   recreate existing boundary tests. Preserve generator, SVG, mapping and orientation coverage.
4. **Close asset browser acceptance only when resumed by the user.** Live recognizability and
   interaction checks remain for Pivot Flat Bench, Range Adjustable Dumbbells, Surge Compact
   Treadmill, Compact Dual-Pulley Station, Loop Cable Trainer, Flex Studio Dumbbells,
   Freestanding Dip Bars, Groundwork Exercise Mat and Wall-Mounted Punching Bag. Include the
   Forge kettlebell in the acceptance audit without restarting its stopped refinement.
   Offline previews and general editor checks do not establish each model's browser acceptance.
   Cover selected/error/warning combinations, mounted products and intentional fallbacks.
   This asset-review pause does not impose a blanket ban on the separate submission release checks.
5. **Measure a representative complete room** with the recipe below. Individual asset estimates
   do not establish room performance or interaction acceptance.

Optional hardening, not a release blocker or approved scope expansion: legacy-item re-placement
has domain/plan coverage in [catalog retirement tests](../src/data/products/catalog-retirement.test.ts),
but no dedicated WebMCP-handler re-placement case was found. Retain this as a coverage opportunity,
not a known defect; add it only as a proportionate part of related integration work.

## Complete-room measurement recipe

When asset browser work resumes, use the checked-in
[demo fixture](../src/features/project/fixtures/demo-project.json), extended with Range dumbbells,
Anchor wall pull-up bar and Surge treadmill through the normal project path. Preserve the demo's
legacy Ironvale fallback. Record the actual layout, placement poses and validation state; the
seven-product asset census is not itself a validated arrangement.

- Record commit, machine, browser version/GPU backend, CSS canvas size, device pixel ratio and
  production versus development build. Identify renderer instrumentation; do not invent metrics
  when available browser tooling cannot expose them.
- Record network assets actually loaded. Use [the GLB inspector](../scripts/inspect-glb.mjs) for
  reproducible static sizes, triangles, primitives and hashes. Static primitive counts are not
  renderer draw calls; disk bytes are not transfer size or GPU allocation.
- Measure 3D activation to first submitted frame, and separately to first frame with all expected
  GLBs loaded, because fallbacks may paint first. State whether asset/module caches are cold or warm.
- Capture steady-frame renderer triangles and draw calls and state whether shadow passes count.
  Include room shell, obstacles, doors, zones, fallbacks and selection outlines in runtime results.
- Record texture count and memory bytes only when tooling reports each. Source GLBs without
  textures can still incur shadow-map/framebuffer allocations; texture count is not byte usage.
- While orbiting at the editor viewport, record frame-interval median/p95 and observation duration.
  Report interaction observations separately. Keep results as review evidence tied to the measured
  revision, not machine-dependent CI thresholds or a permanent phase report.

## Validation and exit gate

For implementation, run narrow affected asset/manifest/fallback tests, then `npm run quality:quick`,
`npm run lint:report` and `npm run agent:verify`; run `npm run build` when routing, runtime boundaries
or deployment-sensitive behavior changes. Final room acceptance must identify the tested build.

Target at most 24 mesh nodes, 12 material groups and 1 MB per GLB; record justified exceptions.
Every released model needs reproducible source, a generated top SVG, explicit mapping and an
intentional catalog image or fallback. Close only when manifest, bounds, failure integration and
room acceptance are resolved or explicitly cut. Do not report paused checks as passed. Remove
this plan after completion, preserving current contracts and reproducibility in authoritative docs.
