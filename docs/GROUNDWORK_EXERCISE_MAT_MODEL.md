# Groundwork Exercise Mat — unrolled model provenance

The model depicts one fully unrolled charcoal foam mat with rounded corners, gently bevelled
sidewalls, a matte top panel and a narrow inset orange perimeter stripe. It follows the accepted
photo without modelling microscopic grain, a rolled end or additional accessories.

- [Generator](../scripts/generate-groundwork-exercise-mat-glb.mjs)
- [GLB](../public/assets/groundwork-exercise-mat.glb)
- [Derived top SVG](../public/assets/groundwork-exercise-mat-top.svg)
- [Photo provenance](../scripts/catalog-image-provenance/groundwork-exercise-mat.json)

`product_groundwork_exercise_mat` reserves its 65 × 180 × 1 cm floor footprint with zero use-zone
margins. This covers the mat itself; exercises extending beyond it need additional clear space.
Mobility Kit remains separate. Catalog dimensions and domain rules, not visual mesh data, control
collision and walking access.

The model uses three material groups, unit scale, centred X/Z, base Y=0 and negative-Z front.
Its bounds are X ±0.325 m, Z ±0.90 m, Y 0..0.01 m within float precision tolerance.

```sh
node scripts/generate-groundwork-exercise-mat-glb.mjs
npm run assets:top-views
node scripts/inspect-glb.mjs public/assets/groundwork-exercise-mat.glb
node scripts/render-product-reference.mjs public/assets/groundwork-exercise-mat.glb /tmp/groundwork-exercise-mat-front.png front
```

Follow the [visual strategy](PRODUCT_VISUALS_STRATEGY.md); remaining runtime/browser acceptance
belongs to the paused [asset plan](../plans/phase-16-product-visual-assets.md).
