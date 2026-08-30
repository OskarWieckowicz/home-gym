# Range Adjustable Dumbbells visual asset

## Scope and implementation

Create original procedural geometry for `product_range_adjustable_dumbbells`: two segmented
adjustable dumbbells in separate cradles on one low stand. The stand is a presentation assumption
to fit the catalog's 62 cm overall height; the product remains one placeable item. Keep catalog
dimensions 48 × 54 × 62 cm and all existing clearance/placement rules unchanged.

1. Model two parallel handles, layered weight packs, front orange selector dials, black rear
   caps, cradle trays, a steel support frame, and rubber floor feet using existing helpers.
2. Generate a deterministic GLB merged by material and projected top-view SVG; map both in the
   registry at unit scale, with floor pivot at origin and pickup/front direction negative Z.
3. Test reproducibility, checked-in output consistency, bounds, normals, budgets, GLTF loading,
   pair geometry, front-facing markers, and 2D use-zone orientation at all four rotations.
4. Run focused tests, `quality:quick`, `lint:report`, `agent:verify`, and production build.

Carry forward the user's request to skip browser verification. Do not open or inspect a browser.
Catalog imagery retains the existing intentional fallback. No client renderer or domain logic
changes are required. Live recognizability, interaction, forced asset failure and room performance
remain unverified; automated checks do not substitute for visual acceptance.

## Evidence

Generated 30 August 2026 from original procedural geometry and the repository's existing
geometry toolkit. No external models, textures, licensed meshes, or generation services used.

| Fact | Result |
|---|---|
| Product / family | `product_range_adjustable_dumbbells` / adjustable dumbbells with cradles |
| Generator | `scripts/generate-range-adjustable-dumbbells-glb.mjs` |
| Revision | `Range Adjustable Dumbbells generator v1` |
| Model | `public/assets/range-adjustable-dumbbells.glb` |
| Top view | `public/assets/range-adjustable-dumbbells-top.svg` |
| Bounds XYZ, metres | min `[-0.24, 0, -0.27]`, max `[0.24, 0.62, 0.27]` |
| Floor contact / origin | zero floor error / centered XZ footprint |
| Triangles / vertices / authored parts | 4,640 / 5,136 / 80 |
| Mesh nodes / materials / estimated base-pass draw calls | 5 / 5 / 5 |
| GLB / SVG size | 155,600 / 50,184 bytes |
| SVG projected triangles | 1,142 |
| Scale / front | `[1, 1, 1]` / negative Z, marked by orange selector dials |
| Palette | graphite stand, dark iron, black rubber, orange selectors, steel handles |
| Catalog imagery | existing intentional fallback, unchanged |

39 focused tests passed, including deterministic GLB and SVG regeneration, exact bounds and
floor contact, material-group budgets and normals, registry mapping, GLTFLoader parsing, four
distinct weight packs with clear grip spaces, actual front-selector orientation, and 2D footprint
and asymmetric use-zone alignment at 0/90/180/270 degrees. Existing fallback tests still pass.

Final validation: `quality:quick` passed; `agent:verify` passed (75 files, 544 tests); production
`build` and `git diff --check` passed. `lint:report` reports zero errors and 29 existing advisory
warnings, with no new warnings from this slice. No browser was opened or inspected.

The GLTFLoader check runs in Node, not a browser. Visual recognition, live rendering and complete
room performance are unverified by request. Draw-call counts above are an asset estimate, not a
measured room benchmark. Stand inclusion is a visual assumption; catalog facts are unchanged.
