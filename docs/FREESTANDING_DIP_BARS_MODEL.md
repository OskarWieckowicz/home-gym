# Freestanding Dip Bars — model and catalog provenance

Created 30 August 2026 after the user approved the height-adjustable photo v2 and requested
a 3D model and catalog integration. [Implementation plan](../plans/freestanding-dip-bars-model.md).

- [Photo v2](../public/assets/freestanding-dip-bars-catalog-concept-v2.png) and [image provenance](../scripts/catalog-image-provenance/freestanding-dip-bars-concept-v2.json).
- [Generator](../scripts/generate-freestanding-dip-bars-glb.mjs), [GLB](../public/assets/freestanding-dip-bars.glb), [derived top SVG](../public/assets/freestanding-dip-bars-top.svg).
- [Front preview](asset-previews/freestanding-dip-bars-front.png), [rear preview](asset-previews/freestanding-dip-bars-rear.png).

## Form and planning assumptions

Two independent inverted-U stands, four telescoping legs, sleeve collars, adjustment-hole
marks and star-shaped locking knobs, two black grips and four transverse rubber-capped feet.
The photo guides appearance only. The simplified static model uses smooth tube bends,
material-separated hardware and lightweight dark disks to represent holes; it is not a
manufacturing drawing or an engineered adjustment mechanism. No dynamic height controls.

The new fictional `product_freestanding_dip_bars` / `freestanding-dip-bars` catalog entry is
named Freestanding Dip Bars by Kiln Strength. The pair costs PLN 499 once and is represented
by one project item, one floor placement and one rectangular footprint that includes the gap.
Both stands move/rotate together. No rack dependency, wall mounting or anchor requirement.
Existing product identities and saved-project behavior are unchanged.

| Planning assumption | Value |
|---|---|
| Whole pair width × depth × authored height | 120 × 80 × 110 cm |
| Stand centre spacing / foot width | 66 / 54 cm |
| Additional front/back space | 80 cm each |
| Additional left/right space | 40 cm each |
| Minimum ceiling | 210 cm |
| Assembly / flooring | One-person / level hard surface |

These fictional dimensions, price and clearances are not manufacturer specifications or
evidence of exercise safety. Actual spacing, stability, locking, ceiling and movement clearance
must be checked for real equipment and users. No mass, load rating or adjustment range claimed.
Catalog data, not the visible meshes, remains the deterministic geometry source of truth.

## Asset metrics

Authored in metres with Y=0 floor pivot, centred X/Z, front toward -Z and registry scale `[1,1,1]`.

| Metric | Value |
|---|---|
| GLB bytes | 319,552 |
| Triangles / vertices | 9,584 / 10,762 |
| Source parts | 116 |
| Nodes / meshes / primitives / materials | 4 each |
| Bounds | X ±0.60, Y 0..1.10, Z ±0.40 m |
| Top SVG bytes / projected triangles | 113,687 / 2,530 |
| GLB SHA-256 | `a975041d076d0adabed6bbc13efc87dfe2bdbbc57c0c15d060f4b4c3cffc0aa5` |

```sh
node scripts/generate-freestanding-dip-bars-glb.mjs
npm run assets:top-views
node scripts/inspect-glb.mjs public/assets/freestanding-dip-bars.glb
node scripts/render-product-reference.mjs public/assets/freestanding-dip-bars.glb docs/asset-previews/freestanding-dip-bars-front.png front
node scripts/render-product-reference.mjs public/assets/freestanding-dip-bars.glb docs/asset-previews/freestanding-dip-bars-rear.png rear
```

## Verification

Front and rear offline previews visually inspected; GLTFLoader successfully loaded the model.
Reproducibility checks cover byte-identical regeneration, exact envelope, normals, material count,
file/triangle budgets and derived SVG. Browser/GPU review remains paused by earlier user direction.
Integration tests verify search and asset mappings, one item/placement/price for the pair,
undo/redo, and full-pair footprint/use-zone dimensions for all four rotations. Existing product
identities remain intact. Independent geometry and integration review found no actionable defects.
The visible two-stand/four-leg arrangement is manually reviewed, not semantically asserted after
material merging. Existing top SVG files remained unchanged on regeneration.

`quality:quick` and `agent:verify` passed (973 tests in 107 files). Production build passed and
the generated `/catalog/freestanding-dip-bars` HTML includes the approved v2 photo. No deployment.
`lint:report` reports 36 pre-existing warnings, zero errors and no warnings in the new files.
An intermediate parallel verification run timed out waiting for the existing persistence write-error
banner. Its isolated seven-test suite passed without changes; full verification was rerun separately.
