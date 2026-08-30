# Northstar Half Rack visual asset

## Scope

Produce one procedural half-rack variant for `product_northstar_half_rack` using the existing
GLB toolkit. Keep the catalog envelope at 122 × 130 × 215 cm, floor pivot at the origin,
and forward direction at negative Z. Do not change domain geometry, catalog data, or persistence.

## Implementation

1. Author a two-upright open rack with long stabilizing feet, rear braces, pull-up bar,
   orange J-cups and cantilever spotter arms; reuse the accepted graphite/orange rack palette.
2. Generate `public/assets/northstar-half-rack.glb` with geometry merged by material.
3. Generate its deterministic transparent top-view SVG and add explicit runtime mapping.
   Retain the intentional catalog-image fallback; catalog photography is outside this slice.
4. Test reproducibility, canonical bounds/pivot, production budgets, checked-in output agreement,
   mapping, top-view rendering, and fallback coverage using another unmapped product.
5. Inspect the model visually, record measured facts/provenance here, and run focused tests,
   `quality:quick`, `lint:report`, `agent:verify`, and `build`.

## Evidence

Generated and checked on 30 August 2026. Source is original procedural geometry; no external mesh,
texture, or licensed asset is used. Generator revision: `Northstar Half Rack generator v1`.

| Fact | Result |
|---|---|
| Product / family / variant | `product_northstar_half_rack` / rack / open half rack |
| Generator | `scripts/generate-northstar-half-rack-glb.mjs` |
| GLB | `public/assets/northstar-half-rack.glb` |
| Top view | `public/assets/northstar-half-rack-top.svg` |
| Mesh bounds XYZ, metres | min `[-0.61, 0, -0.65]`, max `[0.61, 2.15, 0.65]` |
| Footprint origin / floor error | centered XZ / zero Y error |
| Triangles / vertices | 6,248 / 7,006 |
| Authored parts / merged mesh nodes | 157 / 4 |
| Materials / expected asset draw calls | 4 / 4 (one base render pass) |
| GLB / SVG size | 209,240 / 66,410 bytes |
| Palette | Graphite frame, safety orange attachments, black UHMW/rubber, zinc hardware |
| Runtime scale / forward | `[1, 1, 1]` / negative Z |
| Catalog imagery | Intentional existing fallback; no catalog image generated |

Validation passed: 19 focused tests; `quality:quick`; `agent:verify` (73 files, 520 tests);
production `build`; `git diff --check`. `lint:report` reports 0 errors and 29 advisory warnings,
including two parameter-count warnings in the new generator's small geometry helpers.

Visual review: accepted for this MVP slice in the production room preview, with front/oblique
and side views showing the open two-post frame, J-cups, safety arms, and rear braces. Orbit and
zoom worked. The SVG was inspected at editor size. A WebMCP-created placement was removed by
manual Undo and restored by Redo. The test room had no layout errors and the expected
`ACCESS_NOT_EVALUATED` warning because it had no door; this is not a validated gym layout.
Verification used the isolated `127.0.0.1:3001` origin and left the user's saved localhost room alone.

Preview evidence: [Northstar in the live 3D scene](evidence/northstar-half-rack-3d.png).
This initial review missed the front/use-zone mismatch. The subsequent
[orientation correction](phase-16-visual-orientation-fix.md) aligns both renderers with the domain;
its newer screenshots supersede the initial orientation evidence. Source GLB geometry is unchanged.
There were no browser errors or asset-load fallback warnings; the existing Three.js Clock
deprecation warning remains. The existing per-placement asset error boundary is unchanged;
forced GLB-load failure was not exercised in this slice. Five-angle capture sets and catalog
renders remain deferred under the phase's MVP simplification. Complete-room performance is
a separate Phase 16 exit gate; the draw-call value above is an asset estimate, not a room benchmark.
