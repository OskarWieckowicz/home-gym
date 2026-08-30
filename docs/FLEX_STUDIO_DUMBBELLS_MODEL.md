# Flex Studio Dumbbells — model provenance

Created after user acceptance of the colorful photo and request for a matching 3D model.
[Plan](../plans/flex-studio-dumbbells-model.md).

- [Accepted photo](../public/assets/flex-studio-dumbbells-catalog-concept-v1.png), [photo provenance](../scripts/catalog-image-provenance/flex-studio-dumbbells-concept-v1.json).
- [Generator](../scripts/generate-flex-studio-dumbbells-glb.mjs), [GLB](../public/assets/flex-studio-dumbbells.glb), [derived top SVG](../public/assets/flex-studio-dumbbells-top.svg).
- [Front preview](asset-previews/flex-studio-dumbbells-front.png), [rear preview](asset-previews/flex-studio-dumbbells-rear.png).

Six coated dumbbells in three matching coral/sage/blue pairs, each with two rounded hex heads
and a subtly waisted grip. Three matte materials, no texture downloads, labels, exposed metal
or rack. The model uses simplified geometry at the existing equipment detail level.

The blue and green pairs lie flat in two columns; the coral pair stands on end at the front.
This compact display differs from the flat photo layout to fit the existing 46×24×18cm envelope
without changing saved-project dimensions. It is a static planning illustration, not a storage
safety recommendation. Individual weight values are not inferred from color, image or geometry.

The existing `product_flex_studio_dumbbells` identity, PLN399 price, total18kg, dimensions,
use zones, requirements and floor-placement behavior are unchanged. Photo/model/top are mapped
to that same product. Catalog data remains the source of truth for collision and clearance.
The six weights are one product and move together. No new adjustment controls or product seed.

| Metric | Value |
|---|---|
| GLB bytes | 537,348 |
| Triangles / vertices / source parts | 10,320 / 19,686 / 18 |
| Nodes / meshes / primitives / materials | 3 each |
| Bounds in metres | X ±0.23, Y 0..0.18, Z ±0.12 (float tolerance) |
| Top SVG bytes / projected triangles | 241,801 / 4,818 |
| SHA-256 | `63daa053b4d53c095bc3f1b4f26b2129fd98b60465d1a17d5e5ccbcf45710596` |

Floor pivot is Y0, centred X/Z, forward -Z, registry scale `[1,1,1]`.

```sh
node scripts/generate-flex-studio-dumbbells-glb.mjs
npm run assets:top-views
node scripts/inspect-glb.mjs public/assets/flex-studio-dumbbells.glb
node scripts/render-product-reference.mjs public/assets/flex-studio-dumbbells.glb docs/asset-previews/flex-studio-dumbbells-front.png front
node scripts/render-product-reference.mjs public/assets/flex-studio-dumbbells.glb docs/asset-previews/flex-studio-dumbbells-rear.png rear
```

Offline GLTFLoader front/rear previews inspected: six separate weights, three consistent pairs,
rounded ends, continuous grips and floor contact. Automated checks verify reproducible GLB/SVG,
exact envelope, normals, budget and unchanged seed/mappings. Other generated SVGs are unchanged.
Browser/GPU review remains paused. No route, component or build configuration changes; no build
or deployment for this existing-product asset slice.

Independent geometry review found no actionable defects. Count/color/pose are visually and
structurally reviewed rather than semantically asserted after merging by material. Focused asset
and Flex checks passed (19 tests). `quality:quick` passed; `lint:report` has 36 existing warnings,
zero errors and no new-file warnings.
`agent:verify` passed: 976 tests across 108 files, including TypeScript, lint errors, duplicate
detection and the 500-line file limit.
