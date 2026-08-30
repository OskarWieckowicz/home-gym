# Wall-Mounted Punching Bag

## Product and behavior

Added after the user's explicit model/integration request on 30 August 2026. The accepted
[photo](../public/assets/wall-mounted-punching-bag-catalog-concept-v1.png) establishes appearance,
not engineering specifications. Original fictional Kiln Strength product, 899 PLN; no real
manufacturer association or load rating.

- Catalog envelope: width 60 cm, depth 120 cm, physical height 190 cm.
- Wall-mounted bottom at 30 cm; top at 220 cm. Minimum ceiling 230 cm.
- Entire 60 × 120 cm footprint reserves floor space, including the gap between wall and bag.
- Working margins: front 100 cm, sides 80 cm, rear zero. Static planning assumptions, not
  certified swing clearances, installation advice or a dynamic boxing simulation.
- Requires suitable structural wall, anchors and professional installation. Verify actual
  equipment, structure and manufacturer requirements before purchase or installation.

`mounting: { kind: "wall", bottomHeightCm: 30, blocksFloor: true }` reuses existing wall snapping,
dragging and opening checks. `blocksFloor` makes walking access and collisions use the whole
floor rectangle, even for items lower than the hanging bag. Existing Anchor Pull-Up Bar omits
this flag and keeps its previous elevated behavior. Render height and ceiling checks still use
the real mounting bottom. Suggestions and WebMCP go through the same shared validation/store;
no separate agent placement rules or saved-project migration are introduced.

## Assets and generation

- [Generator](../scripts/generate-wall-mounted-punching-bag-glb.mjs)
- [GLB](../public/assets/wall-mounted-punching-bag.glb)
- [Derived top SVG](../public/assets/wall-mounted-punching-bag-top.svg)
- [Front preview](asset-previews/wall-mounted-punching-bag-front.png)
- [Rear preview](asset-previews/wall-mounted-punching-bag-rear.png)
- [Photo prompt/provenance](../scripts/catalog-image-provenance/wall-mounted-punching-bag-concept-v1.json)

Procedural Three.js geometry is merged by four materials. Rounded lathed body with reinforced
tabs and raised seams, four chains of alternating individual links, attachment rings/swivel,
steel boom, twin braces, three wall plates and exposed fasteners. All rear plate faces lie on
the same wall plane. No wall mesh, support floor, animations, texture downloads or text.

Canonical model X ±0.30 m, Z ±0.60 m, Y 0..1.90 m. Front negative Z, rear positive Z.
Shared scene orientation turns the rear toward the mounting wall and adds the 30 cm elevation;
the GLB does not fake floor blockage using invisible geometry. The conservative domain rectangle
is independent of the bag cylinder's smaller diameter. Display pose and brace arrangement are
original approximations, not an exact copy of the concept photo.

Metrics: 357424 bytes, 15756 triangles, 10798 vertices, 96 source parts, four merged meshes and
four materials. SHA-256: `e8b18db56e0a8e098a63e4767a5ce1c13565f66f7c7002cfdb911b989de6d27d`.
Top SVG: 7242 projected triangles, 424622 bytes.

## Verification

- Offline GLTFLoader front/rear renders inspected: legible chains, bag and complete bracket.
- Reproducibility/bounds/normals/top-view tests passed (18 asset tests).
- Domain/mounting/access/catalog focused checks passed (114 tests across eight files);
  new model mapping and actual scene elevation check passed separately.
- `quality:quick` passed. `lint:report`: zero errors, 36 existing warnings; no new warnings.
- `agent:verify` passed: 997 tests across 110 files, typecheck, lint, duplicates and file-size guards.
- `npm run build` passed; generated bag catalog HTML contains the product identity and accepted photo.
- Independent read-only review found no actionable defects in mounting, floor blockage, shared
  commands, suggestions or model orientation. `git diff --check` passed.
- Browser/GPU review remains paused at user direction; no deployment performed.
