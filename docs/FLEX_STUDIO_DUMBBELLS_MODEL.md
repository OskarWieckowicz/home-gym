# Flex Studio Dumbbells — model provenance

Fictional procedural model guided by the accepted colorful photo.

- [Accepted photo](../public/assets/flex-studio-dumbbells-catalog-concept-v1.png),
  [photo provenance](../scripts/catalog-image-provenance/flex-studio-dumbbells-concept-v1.json).
- [Generator](../scripts/generate-flex-studio-dumbbells-glb.mjs),
  [GLB](../public/assets/flex-studio-dumbbells.glb),
  [derived top SVG](../public/assets/flex-studio-dumbbells-top.svg).

Six coated dumbbells form three coral/sage/blue pairs, with rounded hex heads and subtly waisted
grips. Three matte materials provide the appearance without textures, labels, exposed metal or
rack. The blue and green pairs lie flat in two columns; the coral pair stands on end at the front.
This compact display differs from the flat photo layout to fit the existing 46 × 24 × 18 cm
catalog envelope. It is a static planning illustration, not a storage safety recommendation.
Individual weight values are not inferred from color, image or geometry.

The six weights remain one `product_flex_studio_dumbbells` item and move together, without
adjustment controls. Catalog data defines dimensions, use zones and requirements. The model is
centred X/Z, has a Y=0 floor pivot, negative-Z front and unit registry scale.

```sh
node scripts/generate-flex-studio-dumbbells-glb.mjs
npm run assets:top-views
node scripts/inspect-glb.mjs public/assets/flex-studio-dumbbells.glb
node scripts/render-product-reference.mjs public/assets/flex-studio-dumbbells.glb /tmp/flex-studio-dumbbells-front.png front
node scripts/render-product-reference.mjs public/assets/flex-studio-dumbbells.glb /tmp/flex-studio-dumbbells-rear.png rear
```

Material merging does not retain semantic assertions about individual weights; count, color and
pose need visual review alongside reproducibility/bounds checks. Follow the
[visual strategy](PRODUCT_VISUALS_STRATEGY.md) for shared conventions and exceptions.
