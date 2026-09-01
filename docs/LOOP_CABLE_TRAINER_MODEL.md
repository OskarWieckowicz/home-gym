# Loop Wall Cable Trainer — model provenance

Fictional procedural asset guided by the accepted one-handle catalog photo.

- [Catalog concept v2](../public/assets/single-column-cable-machine-catalog-concept-v2.png).
- [Generator](../scripts/generate-loop-cable-trainer-glb.mjs).
- [GLB](../public/assets/loop-cable-trainer.glb),
  [derived top SVG](../public/assets/loop-cable-trainer-top.svg).

## Geometry and integration

The existing fictional envelope is 62 × 28 × 205 cm. The model is authored directly in metres,
with base Y=0, centred X/Z, front negative Z and unit registry scale. The shallow depth is a
planning assumption, not a dimension inferred from the photograph or achieved by mesh stretching.

One rail, one pulley carriage, **one D-handle**, one 18-plate stack, guide rods and rear mounting
brackets preserve the accepted structure. Cables and wheel internals are simplified; this is not
an engineered mechanism or a load/installation certification.

[Loop's catalog seed](../src/data/products/accessories.ts) uses the same wall-mount path as the
punching bag: `mounting: { kind: "wall", bottomHeightCm: 0, blocksFloor: true }`. Placement snaps
flush to the nearest wall, dragging stays on that wall, and the full 62 × 28 cm footprint reserves
floor space. Mount height 0 cm keeps the column on the floor; ceiling, opening and collision
checks still use the shared mounted-product rules. It is distinct from Compact Dual-Pulley Station.

The GLB/top view are presentation for `product_loop_cable_trainer`; the accepted photo mapping
remains v2. Catalog geometry defines collision, clearance and other validation.

## Reproduction

```sh
node scripts/generate-loop-cable-trainer-glb.mjs
npm run assets:top-views
node scripts/inspect-glb.mjs public/assets/loop-cable-trainer.glb
node scripts/render-product-reference.mjs public/assets/loop-cable-trainer.glb /tmp/loop-cable-trainer-front.png front
node scripts/render-product-reference.mjs public/assets/loop-cable-trainer.glb /tmp/loop-cable-trainer-rear.png rear
```

Geometry is merged into five material groups; single-handle correctness needs visual review
alongside reproducibility/bounds checks. Follow the
[visual strategy](PRODUCT_VISUALS_STRATEGY.md) for shared conventions and exceptions.
