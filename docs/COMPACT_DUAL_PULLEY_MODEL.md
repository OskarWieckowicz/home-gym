# Compact Dual-Pulley Station — model provenance

Generated and reviewed on 30 August 2026 after the user's explicit request for a 3D model
at the detail level of the existing equipment. This is a fictional presentation asset,
not an engineering model. The user subsequently authorized catalog integration on the same day.

## Inputs and outputs

- Shape/style source: [generated catalog concept](../public/assets/compact-dual-pulley-station-catalog-concept-v1.png).
- Earlier form reference: [cable station](cable-station-reference.png).
- Authoring assumptions and scope: [model plan](../plans/compact-dual-pulley-model.md).
- Reproducible generator: [script](../scripts/generate-compact-dual-pulley-station-glb.mjs),
  using the existing `ProceduralGlb` writer and installed Three.js geometry primitives.
- [GLB](../public/assets/compact-dual-pulley-station.glb),
  [derived top view](../public/assets/compact-dual-pulley-station-top.svg),
  [front preview](asset-previews/compact-dual-pulley-station-front.png),
  [rear preview](asset-previews/compact-dual-pulley-station-rear.png).

## Model facts

| Property | Measured / authored value |
|---|---|
| Envelope | 160 cm wide × 100 cm deep × 220 cm high |
| Coordinates | Metres, Y up, floor Y=0, X/Z centred, front negative Z |
| Bounds, XYZ | Min [-0.8, 0, -0.5], max [0.8, 2.2, 0.5], within float32 tolerance |
| GLB bytes | 501,996 |
| Triangles / vertices | 11,236 / 17,918 |
| Nodes / primitives / materials | 5 / 5 / 5, merged by material |
| Surface materials | Graphite frame, brushed metal, black cables/grips, orange controls, dark plates |
| Textures / animations | None; static mesh with normals and PBR material parameters |
| Top SVG | 137,880 bytes; viewBox `-0.8 -0.5 1.6 1` |

Dimensions are fictional design assumptions, not measurements taken from a photo. The
model retains two adjustable pulley carriages, two hanging handles, a multi-grip upper
bar, two simplified stacks behind one enclosure, guide rods, splayed feet and hardware.
Cable paths and pulley systems are simplified visual cues, not a working mechanical
simulation or evidence of resistance ratio, certified loads or safe anchoring.

## Reproduction

```sh
node scripts/generate-compact-dual-pulley-station-glb.mjs
npm run assets:top-views
node scripts/inspect-glb.mjs public/assets/compact-dual-pulley-station.glb
node scripts/render-product-reference.mjs public/assets/compact-dual-pulley-station.glb docs/asset-previews/compact-dual-pulley-station-front.png front
node scripts/render-product-reference.mjs public/assets/compact-dual-pulley-station.glb docs/asset-previews/compact-dual-pulley-station-rear.png rear
```

SHA-256:

| File | SHA-256 |
|---|---|
| Generator | `6c2b72bf4308b4a8f3d2398badc2f45835189d3be7622d2579fad4fab609dd20` |
| Catalog concept source | `8e10555ce20dea1ec0cae2b43a6d8b392c37bba1dbd49c6def4ca5107b407d55` |
| GLB | `accd4780573b29c28edd14981dad8f89c2f9fbf3668cbaefac39d9350034c26b` |
| Top SVG | `6dfdace9d73e431926d22585fd7b5c3400aca13f081ccb40bf22bef869df0a1f` |
| Front preview | `4e34790c817cdec9d242d167dc04b85ee66075dc93257ed2412e206241605ed0` |
| Rear preview | `69d4738406632f6a4c762d2b80e2fa29d6d52ea86dd6fb881a1222c2bc3d6aa5` |

## Validation and limitations

- Inspected the offline front and rear renders: complete visible frame and feet, open
  training area, two handles/carriages, visible stacks and closed rear shroud. Rendered
  silhouette follows the concept with deliberate simplification of small details.
- Focused generator suite: 14 tests passed. Regeneration is byte-identical to the shipped
  GLB and SVG; bounds, normals, five primitives and file/triangle budgets are checked.
- `npm run quality:quick` passed.
- `npm run lint:report`: zero errors, 36 existing advisory warnings; none in the new generator.
- `npm run agent:verify`: passed, including 954 tests across 105 files.
- Fresh-worktree setup required `npm ci` and the documented `next typegen` command to
  produce missing route types before typechecking. No dependency manifest or lock changes.
- Regenerating the full top-view list left all pre-existing assets unchanged.
- The original standalone slice did not include browser/GPU review or runtime integration.
  The browser-review pause remains in effect. Existing Loop identity, dimensions,
  saved projects and domain rules are unchanged.

## Catalog integration

- Authorized by the user's subsequent request to connect this photo and model to the catalog.
- Added `product_compact_dual_pulley_station`, slug `compact-dual-pulley-station`, as a separate
  floor-placeable accessory with fictional brand Kiln Strength and PLN 6,999 planning price.
- The existing photo, GLB and top SVG are mapped through the shared catalog/scene registries.
  Geometry remains unchanged at unit scale; the established presentation adapter handles rotation.
- Catalog dimensions and working zones follow the [integration plan](../plans/compact-dual-pulley-integration.md).
  These demo assumptions are disclosed in the product notes; no weight, load rating or pulley
  ratio is asserted. Loop and all previous product identities remain unchanged.
- Integration checks: focused suite passed (41 tests); `quality:quick`, `lint:report`
  (36 existing warnings, no errors), and `agent:verify` passed (960 tests in 106 files).
  Production build passed with network access for the existing Google-hosted Inter font.
  The generated product route and its catalog image were checked in the built HTML.
  No browser/GPU review was performed.
