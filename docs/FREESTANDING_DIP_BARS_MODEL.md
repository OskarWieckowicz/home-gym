# Freestanding Dip Bars — model and catalog provenance

Fictional procedural asset guided by the accepted height-adjustable catalog photo v2.

- [Photo v2](../public/assets/freestanding-dip-bars-catalog-concept-v2.png),
  [image provenance](../scripts/catalog-image-provenance/freestanding-dip-bars-concept-v2.json).
- [Generator](../scripts/generate-freestanding-dip-bars-glb.mjs),
  [GLB](../public/assets/freestanding-dip-bars.glb),
  [derived top SVG](../public/assets/freestanding-dip-bars-top.svg).

## Form and planning assumptions

Two inverted-U stands have four telescoping legs, sleeve collars, adjustment-hole marks,
star-shaped locking knobs, two grips and four transverse rubber-capped feet. Smooth bends and
lightweight disks for holes are static simplifications, not a manufacturing drawing or engineered
adjustment mechanism. There are no dynamic height controls.

`product_freestanding_dip_bars` is one pair: one shopping item, one floor placement and one
rectangular footprint including the gap. Both stands move/rotate together. The authored envelope
is 120 × 80 × 110 cm, with 66 cm stand-centre spacing and 54 cm foot width. The
[accessory seed](../src/data/products/accessories.ts) defines front/back margins of 80 cm each,
left/right margins of 40 cm each, minimum ceiling 210 cm, one-person assembly and level hard
flooring. No rack dependency, wall mounting or anchoring is assumed.

These fictional dimensions and clearances are not manufacturer specifications or evidence of
exercise safety. Actual spacing, stability, locking, ceiling and movement clearance need checks
for the real equipment and user. No mass, load rating or adjustment range is claimed.

## Reproduction

Authoring uses metres, centred X/Z, base Y=0, front negative Z and unit registry scale. Static
geometry is merged into four material groups. Semantic stand/leg counts still need visual review.

```sh
node scripts/generate-freestanding-dip-bars-glb.mjs
npm run assets:top-views
node scripts/inspect-glb.mjs public/assets/freestanding-dip-bars.glb
node scripts/render-product-reference.mjs public/assets/freestanding-dip-bars.glb /tmp/freestanding-dip-bars-front.png front
node scripts/render-product-reference.mjs public/assets/freestanding-dip-bars.glb /tmp/freestanding-dip-bars-rear.png rear
```

Follow the [visual strategy](PRODUCT_VISUALS_STRATEGY.md); remaining runtime/browser acceptance
belongs to the paused [asset plan](../plans/phase-16-product-visual-assets.md).
