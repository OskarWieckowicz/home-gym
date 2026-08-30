# Pivot Flat Bench visual asset

## Scope and implementation

Generate an original procedural flat-bench variant for `product_pivot_flat_bench`, using the
existing geometry helpers and the graphite/charcoal/orange bench family palette. Preserve
catalog dimensions (58 × 124 × 44 cm), use zones, domain commands, and persistence.

1. Build a continuous horizontal pad on a fixed steel frame with rubber feet, front lift
   handle (negative Z), and rear transport wheels. No adjustable hinge or incline ladder.
2. Generate a GLB merged by material and its deterministic top-view SVG; map both explicitly
   in the existing registry with unit scale and the floor pivot at the origin.
3. Check reproducibility, checked-in output agreement, normals, bounds, floor contact,
   flat upholstery, asset budgets, registry mapping, and 2D orientation/use zones.
4. Run focused tests, `quality:quick`, `lint:report`, `agent:verify`, and production build.

The user explicitly requested no browser verification. Do not open, inspect, or capture a
browser for this slice. Runtime visual acceptance and interactive smoke checks are therefore
unverified, overriding the broader Phase 16 browser-review step for this request. Catalog
imagery retains the existing intentional fallback. No client rendering logic changes are needed.

## Evidence

Generated on 30 August 2026. Original procedural geometry using the existing local toolkit;
no external mesh, textures, network generation service, or third-party licensed asset.

| Fact | Result |
|---|---|
| Product / family / variant | `product_pivot_flat_bench` / bench / fixed flat pad |
| Source / revision | `scripts/generate-pivot-flat-bench-glb.mjs` / `Pivot Flat Bench generator v1` |
| Model | `public/assets/pivot-flat-bench.glb` |
| Top view | `public/assets/pivot-flat-bench-top.svg` |
| Bounds XYZ, metres | min `[-0.29, 0, -0.62]`, max `[0.29, 0.44, 0.62]` |
| Floor contact / origin | zero floor error / centered XZ footprint |
| Triangles / vertices / authored parts | 1,196 / 1,536 / 37 |
| Mesh nodes / materials / estimated base-pass draw calls | 5 / 5 / 5 |
| GLB / SVG bytes | 48,456 / 13,827 |
| Top-view projected triangles | 296 |
| Scale / canonical front | `[1, 1, 1]` / negative Z (lift handle) |
| Pad | one horizontal 31 × 110 × 7 cm pad, upper surface at 44 cm |
| Catalog imagery | existing intentional fallback, unchanged |

Focused validation: 33 tests passed, covering byte-for-byte GLB reproducibility, committed GLB
and SVG agreement, normals, exact bounds and floor contact, flat-pad envelope, budgets,
registry mapping, and 2D footprint/use-zone alignment at all four rotations. Existing
orientation regression tests also passed. `quality:quick` passed.

Final validation: `agent:verify` passed (74 test files, 534 tests); production `build` passed;
`git diff --check` passed. `lint:report`: zero errors, 29 existing advisory warnings, no new
warnings from this slice. The new model is integrated; visual acceptance remains unverified.

Browser recognizability, GLB loading in the live scene, orbit interaction, forced load failure,
and room performance are not verified in this slice, as requested. Draw calls above are an
asset estimate, not a measured room benchmark. The shared renderers, orientation adapter,
domain footprint, clearance rules, and fallback implementation remain unchanged.
