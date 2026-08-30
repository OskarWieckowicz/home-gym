# Phase 16 — Remaining visual-asset work

> Updated: 30 August 2026.
> Model generation is complete for the selected Tier 0 and Tier 1 products.
> This plan contains only unresolved integration and acceptance work.

## Scope

Finish the asset audit and integration checks without generating more catalog models.
Use the existing [runtime registry](../src/features/creator/scene/visual-assets.ts),
[generators](../scripts/), and [assets](../public/assets/) as the implementation source.
Architecture and coordinate conventions live in
[TECHNICAL_ARCHITECTURE.md](../docs/TECHNICAL_ARCHITECTURE.md).

Keep these decisions:

- Catalog data remains the source of dimensions, placement, clearance, and prices.
- GLBs use metres, a centered floor pivot, and negative-Z forward. Both views use the existing
  orientation adapter; asset changes must not alter domain geometry or saved poses.
- The strength-station bundle is one catalog placement. It does not enable nesting between
  independent products or weaken collision rules.
- Deterministic top-view SVGs and existing catalog art/fallbacks are sufficient for the MVP.
  Remaining requested photos are tracked in [the catalog queue](phase-16-catalog-images.md).
  Multi-angle capture sets remain deferred to presentation polish.
- Keep geometric fallbacks for products outside the selected model set. No extra SKUs,
  sourced meshes, animation, or physics are included.

## Remaining tasks

1. **Complete the manifest.** Record every catalog product as an explicit family/variant or
   intentional fallback. Link registered models to generators, outputs, provenance and measured
   budgets; validate catalog IDs, unique paths, file existence and registry agreement. Keep
   durable asset metadata outside temporary plans and screenshot evidence.
2. **Audit actual bounds against catalog envelopes.** Include runtime scale and the displayed
   pose. Resolve the Summit cage's source/runtime envelope discrepancy and document any other
   accepted visual exceptions without changing catalog dimensions to fit a mesh. Target at most
   3 cm envelope overrun and 1 cm floor/origin error; larger deviations require a recorded decision.
3. **Complete loader-failure integration coverage.** Isolated missing/invalid-asset boundary,
   healthy-sibling and selected-fallback tests already exist. Verify actual loader failures retain
   per-placement fallbacks through editing, validation, WebMCP and undo/redo; do not recreate the
   completed boundary tests. Preserve generator, SVG, mapping and orientation coverage.
4. **Close runtime acceptance when browser checks are resumed.** Pivot, Range and Surge were
   generated without browser review at the user's request. Their live recognizability and
   interaction remain unverified. Do not run browser checks as part of cleanup or model generation
   unless the user resumes that work.
   General selection, shared 2D/3D state and collision display have local Phase 27/28 evidence.
   Remaining asset-specific checks include selected/error/warning combinations and fallback
   products; do not infer full model acceptance from those general editor checks.
5. **Measure a representative complete room.** Include the strength setup, dumbbells, wall
   accessory and cardio. Record loaded assets, triangles, draw calls, texture memory where
   available, and responsiveness at the demo viewport. This task now owns the outstanding runtime
   benchmark after Phase 20's implementation closure; individual asset estimates are not a room benchmark.
   [Shared performance notes](../docs/PERFORMANCE_NOTES.md) now record the static asset census;
   runtime draw calls, first-frame timing and orbit responsiveness are still open.

## Validation and exit gate

After implementation, run the narrowest affected asset/manifest/fallback tests, then
`npm run quality:quick`, `npm run lint:report`, `npm run agent:verify` and `npm run build`.

Target at most 24 mesh nodes, 12 material groups and 1 MB per GLB; record justified exceptions.
Every released model needs a reproducible source, generated top SVG, explicit mapping and
intentional catalog image or fallback. Close Phase 16 only when manifest coverage, bounds
decisions, failure coverage and the shared room-performance check are resolved. Do not label
skipped browser checks as passed. Remove this plan after the remaining exit gate passes or the
user explicitly cuts the outstanding scope.
