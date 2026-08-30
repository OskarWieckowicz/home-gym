# Groundwork Exercise Mat — deployed model

Added on 30 August 2026 after the user requested the missing model. Existing product
`product_groundwork_exercise_mat`, price, photograph, floor placement, dimensions 65 × 180 × 1 cm,
zero use-zone margins and collision/access rules are unchanged. Mobility Kit remains separate.

The model depicts one fully deployed charcoal foam mat with rounded corners, gently bevelled
sidewalls, a matte top panel and a narrow inset orange perimeter stripe. It follows the approved
photo without modelling microscopic grain, a rolled end or additional accessories.

- [Generator](../scripts/generate-groundwork-exercise-mat-glb.mjs)
- [GLB](../public/assets/groundwork-exercise-mat.glb)
- [Top SVG](../public/assets/groundwork-exercise-mat-top.svg)
- [Offline front preview](asset-previews/groundwork-exercise-mat-front.png)
- [Existing photo provenance](../scripts/catalog-image-provenance/groundwork-exercise-mat.json)

Bounds: X ±0.325 m, Z ±0.90 m, Y 0..0.01 m (float precision tolerance). Scale 1, origin floor
pivot and negative-Z forward. Three material groups, 1594 triangles, 4276 vertices, 115104 bytes.
SHA-256: `e17b96ac625dd45930948b96a2ba5b380e5493d171fe81367d8a5c6c192204b4`.
Derived SVG: 838 projected triangles, 38400 bytes.

Offline preview loaded through Three GLTFLoader and visually inspected. Reproducibility, bounds,
normals and top-view checks plus mapping/seed regressions are included in the existing test suite.
Focused checks passed: 23 tests. `quality:quick` and `agent:verify` passed (999 tests across
110 files); `lint:report` has zero errors and 36 existing warnings. `git diff --check` passed.
No application behavior or routing changes; browser/GPU review remains paused and no deployment
is performed.
