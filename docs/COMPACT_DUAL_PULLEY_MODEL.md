# Compact Dual-Pulley Station — model provenance

Fictional procedural presentation asset based on the accepted catalog concept. Images establish
appearance, not measured dimensions, mechanical operation or installation certification.

- [Catalog concept](../public/assets/compact-dual-pulley-station-catalog-concept-v1.png),
  [image provenance](../scripts/catalog-image-provenance/compact-dual-pulley-station-concept-v1.json).
- [Generator](../scripts/generate-compact-dual-pulley-station-glb.mjs),
  [GLB](../public/assets/compact-dual-pulley-station.glb),
  [derived top view](../public/assets/compact-dual-pulley-station-top.svg).

## Geometry and planning assumptions

The 160 × 100 × 220 cm envelope is authored in metres, Y up, base Y=0, centred X/Z, front
negative Z and unit registry scale. Five material groups represent graphite frame, brushed
metal, black cables/grips, orange controls and dark plates. Two adjustable carriages, two handles,
a multi-grip upper bar, two simplified stacks behind one enclosure, guide rods and splayed feet
preserve the concept structure. Cable paths are visual cues, not a working pulley simulation.

`product_compact_dual_pulley_station` is a separate floor-placeable accessory; it does not replace
Loop. The [accessory seed](../src/data/products/accessories.ts) owns its fictional specification:
front/back/left/right margins 180/20/60/60 cm, minimum ceiling 245 cm, suitable floor anchoring,
level hard flooring and professional assembly. It is not a wall-mounted station or rack attachment
and includes no dedicated seated lat-pulldown restraint. No weight, load rating or pulley ratio is
asserted. These are demo planning assumptions, not manufacturer or safety specifications.

## Reproduction

```sh
node scripts/generate-compact-dual-pulley-station-glb.mjs
npm run assets:top-views
node scripts/inspect-glb.mjs public/assets/compact-dual-pulley-station.glb
node scripts/render-product-reference.mjs public/assets/compact-dual-pulley-station.glb /tmp/compact-dual-pulley-station-front.png front
node scripts/render-product-reference.mjs public/assets/compact-dual-pulley-station.glb /tmp/compact-dual-pulley-station-rear.png rear
```

Follow the [visual strategy](PRODUCT_VISUALS_STRATEGY.md) for shared conventions and exceptions.
