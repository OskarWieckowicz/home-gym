# Loop Wall Cable Trainer — model provenance

Created 30 August 2026 after the user requested a model for the accepted one-handle photo.

- Source: [catalog concept v2](../public/assets/single-column-cable-machine-catalog-concept-v2.png).
- Generator: [generate-loop-cable-trainer-glb.mjs](../scripts/generate-loop-cable-trainer-glb.mjs).
- Outputs: [GLB](../public/assets/loop-cable-trainer.glb), [top SVG](../public/assets/loop-cable-trainer-top.svg),
  [front preview](asset-previews/loop-cable-trainer-front.png), [rear preview](asset-previews/loop-cable-trainer-rear.png).
- Working scope: [plan](../plans/loop-cable-trainer-model.md).

## Geometry and integration

The model uses the existing fictional Loop dimensions, 62 cm wide × 28 cm deep × 205 cm high.
It is authored directly in metres with the floor at Y=0, centred X/Z and front toward -Z.
No mesh stretching or inferred photograph dimensions. Both shared renderers use the existing
orientation adapter and the unchanged product pose. Registry scale is `[1, 1, 1]`.

One rail, one pulley carriage, **one D-handle**, one 18-plate stack, guide rods and rear mounting
brackets preserve the accepted structure. Plates, rails, fasteners, controls and handle remain
readable at room scale. Cable paths and wheel internals are simplified; this is neither an
engineered mechanism nor a load/installation certification. The shallow existing depth is a
fictional planning assumption. Brackets do not introduce wall snapping or change placement rules.

Loop's product ID, slug, price, dimensions, clearance, anchoring requirements and saved-project
behavior are unchanged. The photo mapping remains v2. The GLB and derived SVG replace visual
fallbacks only; collision, clearance and other validation still use catalog geometry.

| Metric | Value |
|---|---|
| GLB bytes | 241,904 |
| Triangles / vertices | 5,440 / 8,531 |
| Source parts | 139 |
| Nodes / meshes / primitives / materials | 5 / 5 / 5 / 5 |
| Bounds in metres | X ±0.31, Y 0..2.05, Z ±0.14 |
| Top SVG bytes / projected triangles | 72,163 / 1,382 |
| GLB SHA-256 | `35b2be324f8ba5c2a321adf083bd91c922c3d823ac1bfb4d1643fb92efd49af9` |

## Reproduction and verification

```sh
node scripts/generate-loop-cable-trainer-glb.mjs
npm run assets:top-views
node scripts/inspect-glb.mjs public/assets/loop-cable-trainer.glb
node scripts/render-product-reference.mjs public/assets/loop-cable-trainer.glb docs/asset-previews/loop-cable-trainer-front.png front
node scripts/render-product-reference.mjs public/assets/loop-cable-trainer.glb docs/asset-previews/loop-cable-trainer-rear.png rear
```

Offline front and rear previews inspected: one connected handle, stack and rails, visible wall
brackets, complete base and top. The rear view confirms a full upright rather than a hollow facade.
Focused asset, registry and catalog checks passed (31 tests): byte-identical GLB/SVG regeneration,
exact envelope, normals present, material/triangle/byte budgets, and unchanged Loop catalog data.
Existing top-view assets did not change on regeneration. Browser/GPU review remains paused.
No routing, Next configuration or component boundary changes; no production build required.

`quality:quick` and `agent:verify` passed (963 tests across 106 files). `lint:report` has
36 pre-existing warnings and no errors or new generator warnings. Independent review found no
actionable geometry or integration defects. Offline preview rendering also loaded the GLB through
Three.js GLTFLoader. Single-handle correctness is visually reviewed rather than asserted by a
semantic automated test, since geometry is merged per material.
