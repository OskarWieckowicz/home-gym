# Wall-Mounted Punching Bag — model provenance

## Product and mounting assumptions

The accepted [photo](../public/assets/wall-mounted-punching-bag-catalog-concept-v1.png) establishes
appearance, not engineering specifications. This is fictional equipment without real manufacturer
association or load certification. The [accessory seed](../src/data/products/accessories.ts)
owns the planning assumptions:

- Envelope 60 × 120 × 190 cm, mounted bottom 30 cm, top 220 cm and minimum ceiling 230 cm.
- The entire 60 × 120 cm footprint reserves floor space, including the wall-to-bag gap.
- Working margins are front 100 cm, sides 80 cm, rear zero; bag swing is not simulated.
- Suitable structural wall, anchors and professional installation are required. Verify actual
  equipment, structure and manufacturer requirements before purchase or installation.

`mounting: { kind: "wall", bottomHeightCm: 30, blocksFloor: true }` uses shared wall snapping,
dragging and opening checks. `blocksFloor` makes walking access and collisions use the whole
floor rectangle, even for objects lower than the bag. Anchor Pull-Up Bar omits this flag and
retains elevated behavior. Render height and ceiling checks use the actual mounting bottom;
WebMCP and suggestions use the same domain rules.

## Assets and reproduction

- [Generator](../scripts/generate-wall-mounted-punching-bag-glb.mjs)
- [GLB](../public/assets/wall-mounted-punching-bag.glb)
- [Derived top SVG](../public/assets/wall-mounted-punching-bag-top.svg)
- [Photo prompt/provenance](../scripts/catalog-image-provenance/wall-mounted-punching-bag-concept-v1.json)

Procedural Three.js geometry is merged by four materials: rounded lathed bag with reinforced tabs
and seams, four chains of alternating links, rings/swivel, boom, twin braces, three wall plates and
fasteners. Rear plate faces share one wall plane. There is no wall mesh, support floor, animation,
texture download or text. The display pose and braces are original approximations of the photo.

Local bounds are X ±0.30 m, Z ±0.60 m, Y 0..1.90 m, with front negative Z. The shared orientation
adapter turns the rear toward the mounting wall and adds 30 cm elevation. Invisible geometry does
not fake floor blockage; the conservative domain rectangle is independent of the bag diameter.

```sh
node scripts/generate-wall-mounted-punching-bag-glb.mjs
npm run assets:top-views
node scripts/inspect-glb.mjs public/assets/wall-mounted-punching-bag.glb
node scripts/render-product-reference.mjs public/assets/wall-mounted-punching-bag.glb /tmp/wall-mounted-punching-bag-front.png front
node scripts/render-product-reference.mjs public/assets/wall-mounted-punching-bag.glb /tmp/wall-mounted-punching-bag-rear.png rear
```

Follow the [visual strategy](PRODUCT_VISUALS_STRATEGY.md) for shared conventions and exceptions.
