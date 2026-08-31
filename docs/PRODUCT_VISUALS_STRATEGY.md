# Product visuals strategy

## Purpose and domain boundary

Catalog photos, transparent 2D top views and spatial 3D models represent the same fictional
products. The creator supports editing in both 2D and 3D through the shared project store;
visuals do not define dimensions, placement, clearance, collisions, ceiling checks or budget.
Those remain deterministic catalog and domain data.

The current source maps are the [catalog image registry](../src/features/catalog/product-assets.ts),
[3D/top-view registry](../src/features/creator/scene/visual-assets.ts) and
[product seeds](../src/data/products/). Selection-only accessories need catalog images but do
not require independent room models. Do not infer runtime coverage from old production counts.

## Production workflow

Use reproducible, offline procedural GLB generators for equipment, reusing geometry parts where
useful. Keep actual binary meshes with their generators; a primitive recipe or pseudo-isometric
illustration alone is not evidence that a model looks recognizable in the room.

Catalog concepts may precede a model. Accepted photos can guide a later procedural model, as in
Compact, Loop and Flex. Conversely, a GLB render can guide a catalog image or controlled image
edit. In either order, preserve recognizable structure and plausible proportions across the
representations; a photo is not a source of engineering dimensions or installation certification.
The derived 2D top view always comes from the GLB, not an independently generated image.

1. Confirm the existing product identity, domain envelope, mounting and intended display pose.
2. Generate or revise a real GLB using the shared toolkit, then inspect bounds, normals, material
   groups and file/triangle cost. Record deliberate visual exceptions rather than silently
   changing catalog dimensions to match a mesh.
3. Review the model's silhouette and structure at useful room scale and camera angles. Automated
   bounds and reproducibility checks cannot replace visual acceptance.
4. Generate a transparent top view from the accepted GLB and register assets explicitly by product
   ID. Keep missing/failed-asset behavior independent of placement and validation commands.
5. Preserve source images, prompts, provenance, generator/output links and non-obvious assumptions.
   Review runtime performance with a furnished room before claiming public-device acceptance.

The [visual registry](../src/features/creator/scene/visual-assets.ts) maps all 22 placeable
products to an explicit family/variant or geometric fallback. The two selection-only accessories
have catalog images and no room models. All 24 active products have mapped photos; there is no
missing-photo queue. Multi-angle capture sets, new SKUs, sourced meshes, animation and physics
remain outside the MVP. This strategy does not authorize new image batches, purchases or review.

Target at most 3 cm envelope overrun and 1 cm floor/origin error after runtime scale and displayed
pose. Larger deviations need a recorded decision; do not change catalog dimensions to fit a mesh.
Target at most 24 mesh nodes, 12 material groups and 1 MB per GLB; record justified exceptions.
Every released model needs a reproducible generator, a generated top SVG, explicit registry
mapping and an intentional catalog image or fallback. Preserve generator, SVG, mapping and
orientation coverage when changing assets.

Live per-model browser recognizability, kettlebell silhouette refinement and complete-room runtime
metrics are not remaining production work. Do not claim they passed from isolated asset estimates
or general editor checks; submission claims must use observed public-build evidence.

## Catalog images and provenance

Use a coherent studio presentation: complete product, consistent crop, restrained background and
lighting, no embedded dimensions or misleading real manufacturer branding. A polished concept
may simplify details but must not imply verified engineering, safe loads or actual certification.
Keep the accepted prompt, input images and output provenance under
[scripts/catalog-image-provenance/](../scripts/catalog-image-provenance/). Existing provenance
records describe their generation event; current product mappings live in the registry.

Licensed model libraries are a fallback for families the procedural approach cannot represent
adequately. Verify license, attribution and public-repository redistribution rights before use.
Record the author, direct source URL, license version, acquisition date, required attribution and
modifications. Prefer CC0 or CC BY assets without logos. Do not accept NonCommercial,
NoDerivatives, editorial-only or unclear licenses; a marketplace label such as Royalty Free
alone is insufficient evidence of permission to redistribute the derived GLB publicly.
Check generation service availability, model versions and pricing when arranging a batch;
monetary estimates and provider claims are not permanent architectural facts.

## Asset coordinates and runtime adapters

- Author in metres, Y up, centred X/Z, with model base at Y=0 and canonical front toward negative Z.
  A mounted model uses this local base; the scene applies its catalog mounting elevation.
- Register GLB paths, optional top-view paths, catalog envelopes and explicit scales through the
  visual registry. Do not use product-name or category guesses to select meshes.
- Apply project position/rotation through the shared
  [orientation adapter](../src/features/creator/scene/visual-orientation.ts). Most assets use unit
  scale; the Summit exception below must remain explicit.
- Load GLBs only on the client. An asset-local
  [error boundary](../src/features/creator/scene/scene-asset-boundary.tsx) provides the catalog-sized
  cuboid for failed loads; unregistered and legacy products also use geometric fallback. Failed
  loads stay isolated per placement through editing, validation, WebMCP and undo/redo.
- Keep hit targets, selection/invalid outlines, collision inputs and clearance regions derived
  from catalog geometry. Neither mesh bounds nor transparent image pixels redefine these.

## Deterministic top views

[generate-product-top-views.mjs](../scripts/generate-product-top-views.mjs) reads GLB positions,
indices, node transforms and material colors through the
[top-view projector](../scripts/lib/glb-top-view.mjs). It projects upward-facing triangles from
positive Y into transparent SVG, offline, without a browser or image-generation dependency.
Canonical negative Z points toward the SVG's top; the 2D renderer applies the shared placement
rotation convention. Assets have no baked-in labels, selections, warnings or use zones.

## Toolkit and reproducibility

[procedural-glb.mjs](../scripts/lib/procedural-glb.mjs) provides geometry, bounds, per-material
merging, binary buffers and GLB writing. [equipment-parts.mjs](../scripts/lib/equipment-parts.mjs)
provides reusable beams, pads, feet and wheels. Merge static geometry by material to keep draw
calls low; the writer uses 16-bit indices where possible and 32-bit indices for larger groups.
The generators are authoring tools, not runtime dependencies. The Forge kettlebell ships as the
current generated model; further silhouette refinement is out of scope unless explicitly resumed.

Harbor, Northstar and Summit explicitly call `orientFacesToNormals()` before writing their GLBs.
Some legacy chamfer/cylinder primitives have triangle winding opposite to their authored
outward normals. This offline pass corrects indices only; dimensions, normals and materials
are preserved. Other published assets are not regenerated implicitly. Apply the pass when
reviewing those models individually. It assumes correct outward authored normals and does
not repair intersecting solids. Structural visibility tests must retain normal front-face
culling: forcing `DoubleSide` masks missing outer faces and internal contact-surface flicker.
The offline reference rasterizer does not cull back faces, so its previews alone cannot
verify this rendering contract.

Run the individual generator documented with a model, then `npm run assets:top-views` to rebuild
derived SVGs. [inspect-glb.mjs](../scripts/inspect-glb.mjs) reports current bounds, triangles,
nodes, primitives, materials, file size, normals, generator metadata and SHA-256. Use this output
for current measurements instead of retaining an ever-growing census in documentation.
[render-product-reference.mjs](../scripts/render-product-reference.mjs) provides offline preview
images; the model records show reproducible front/rear commands where applicable. Offline
previews do not establish live browser recognizability.

When claiming public-device or interaction acceptance, measure a representative furnished room
rather than summing individual asset estimates. Use the checked-in
[demo fixture](../src/features/project/fixtures/demo-project.json), extended through the normal
project path if needed, and preserve any intentional legacy fallback. Record commit, machine,
browser/GPU, canvas size, device pixel ratio and production versus development build. Measure 3D
activation to first submitted frame, and separately to first frame with expected GLBs loaded,
because fallbacks may paint first. Capture steady-frame triangles and draw calls (state whether
shadows count), network assets actually loaded, and orbit frame-interval median/p95. Static
primitive counts are not renderer draw calls; disk bytes are not transfer size or GPU allocation.
Keep results as review evidence tied to the measured revision, not machine-dependent CI thresholds.

## Accepted visual exceptions and compositions

### Olympic Bench Set

`product_olympic_bench` is one Benches product and one placement containing a fixed flat bench,
two integrated uprights, a 220 cm barbell and four loaded plates. The accepted
[catalog concept](../public/assets/olympic-bench-catalog-concept-v1.png) guides the silhouette,
graphite/black materials and restrained orange accents. The original image provenance records
the concept-generation event before catalog registration.

The fictional planning envelope is 220 × 160 × 140 cm, including both bar ends. Clearance is
60 cm at front/rear and 50 cm at either side for access. The illustrative $825 price covers
the whole set; the plates and bar do not add separate shopping items. Dimensions, clearances
and price are planning assumptions, not measurements from the image or certified specifications.
No maximum load or plate mass is claimed.

Regenerate with `node scripts/generate-olympic-bench-glb.mjs`; the top SVG is derived from this
GLB through `generateGlbTopViewSvg` in `scripts/lib/glb-top-view.mjs` and is included in
`npm run assets:top-views`. The model uses unit scale, a floor origin and negative-Z front.
It is static presentation geometry and does not make its constituent parts independently editable.

### Northstar Half Rack

The [v4 generator](../scripts/generate-northstar-half-rack-glb.mjs) refines the existing
catalog silhouette: exactly two hollow uprights with actual adjustment holes through all
four walls, lined bent-plate J-cups, long lined spotters with paired under-arm gussets,
ring pins, bolted brackets, rear braces and crossmembers, foot mounting tabs and a
straight pull-up bar with grips and supported collars. No cage, weights or storage pegs
are added. The 122 × 130 × 215 cm envelope, unit scale, origin and negative-Z front remain
unchanged. Four material groups are merged; indexed authoring geometry shares vertices
only where normals match. This is a static planning model, not engineering validation.

Regenerate with `node scripts/generate-northstar-half-rack-glb.mjs`, then
`npm run assets:top-views`. Offline preview:
`node scripts/render-product-reference.mjs public/assets/northstar-half-rack.glb /tmp/northstar-front.png front`
(use `rear` with a separate output for the reverse view). The catalog photo now uses the
updated [v4 photographic variant](../scripts/catalog-image-provenance/northstar-half-rack-v4.json):
charcoal attachments with small orange accents at the spotter tips and J-cup edges. The GLB and its derived
top view match this palette: graphite J-cups, spotters and upper mounts, with muted burnt-orange
strips only on the outer spotter-tip and J-cup edges. Dimensions and placement geometry are unchanged.
The shared catalog image mapping uses `northstar-half-rack-catalog-v4.png`; the creator's
GLB and top-view URLs include `?v=4` so previously cached assets do not mask this update.
The v1 provenance describes the original image event.

### Harbor Squat Stands

The [v2 generator](../scripts/generate-harbor-squat-stands-glb.mjs) follows the existing
Harbor catalog photo: two H bases, triangular gussets, hollow perforated telescoping
uprights, rubber-lined orange J-cups, separate lower spotter arms, bolts and ring pins.
It retains the exact 108 × 82 × 178 cm catalog envelope, origin and negative-Z front;
the pair remains one static placement with no connecting crossbar or included barbell.
The displayed adjustment heights are illustrative, not an engineering or safety claim.
Four merged material groups keep details independent of runtime component count.

Regenerate with `node scripts/generate-harbor-squat-stands-glb.mjs`, then
`npm run assets:top-views`. Inspect offline with
`node scripts/render-product-reference.mjs public/assets/harbor-squat-stands.glb /tmp/harbor-front.png front`
(use `rear` and a separate output for the reverse view). The catalog photo stays unchanged.

### Summit Power Cage

[squat-rack.glb](../public/assets/squat-rack.glb) is generated by the
[v3 generator](../scripts/generate-squat-rack-glb.mjs). It borrows Harbor's manufactured detail:
hollow columns perforated on all four walls, chamfered edges, thin bent orange J-cups with
UHMW liners, hex bolts and washers, ring pins, base gussets and rubber feet. Upper side rails
connect the four posts; the entrance has no floor crossmember. The straight pull-up bar has
grip sleeves, and removable pin-and-pipe safeties align with the column hole rows.

The model keeps five merged material groups and remains below 1 MB. Its approximately 21.7k
triangles (26.8k for the complete station) include actual hole walls; small 20 mm apertures use
eight segments and welded matching vertices to keep the dependent station below 1 MB too.
These static display details do not certify construction or safe loads. The J-cup contact
surface stays at Y=1.453 m; the detailed station's 28 mm shaft is centered at Y=1.467 m to rest on it. Regenerate the dependent
`strength-station-composition.glb` after changing the cage, then regenerate both top views.
The existing catalog photos remain unchanged.

Its unscaled measured envelope is approximately 132 × 174 × 227 cm (width × depth × height),
whereas the catalog remains 130 × 165 × 225 cm. The explicit runtime scale `[1.016, 1, 1.04]`
preserves the accepted appearance; it is not exact normalization to the catalog envelope.
This source/runtime discrepancy is an accepted recorded exception. Do not silently compensate
in domain geometry or derive a family variant by uniform scaling; Northstar already has its own
generator and unit-scale mapping.

### Arc Adjustable Bench

The canonical 35-degree incline raises the backrest to about 94.3 cm, while the catalog's 46 cm
height represents the planning/seat height. This distinction is accepted: the visual extension
does not change stored dimensions, collisions or ceiling validation. The model's approximate
width/depth is 66 × 140.9 cm against the 66 × 142 cm catalog footprint. The catalog concept image
is intentional; deterministic catalog-base and five-angle renders are not mandatory MVP gates.

### Summit Complete Strength Station

[strength-station-composition.glb](../public/assets/strength-station-composition.glb) combines the
Summit rack, Arc bench, Quarry bar and Foundry plates as `product_summit_strength_station`.
It is one project item and one placement with a 228 × 174 cm catalog footprint. Nested pieces
are render-only components; they do not become independent placements or bypass collision rules.

The [v2 composition generator](../scripts/generate-strength-station-composition-glb.mjs) imports
the current Summit rack and uses [composition parts](../scripts/lib/strength-station-parts.mjs)
for refined versions of the Arc bench, Quarry bar and Foundry plates. Standalone product GLBs
are unchanged. The bench retains its reversed 35-degree display incline and separate seat/back
pads, with perimeter piping, a continuous hinge axle, a ladder-engaged support reaching the
backing plate, attached lifting handle and transport wheels.

The 28 mm bar shaft sits at `[0, 1.467, -0.59]`, touching the J-cup liners at Y=1.453 m.
Each sleeve carries two beveled bumper plates flush with its shoulder, followed by a locking
collar and orange lever. Plate profiles have metal annular hubs and real 52 mm bores, including
the six spare discs beside the rack at X=0.95 m. Spare discs retain their floor contact and
approximately 0.45 × 0.36 m footprint. Surface winding is corrected across the entire composition.
Eight merged material groups, about 26.8k triangles and a sub-1-MB binary preserve the existing
asset budgets and approximately 227.5 × 174 × 227 cm measured envelope.

Regenerate with `node scripts/generate-strength-station-composition-glb.mjs`, then regenerate
its top SVG. The derived top view uses the bundle's single catalog footprint for selection and
placement. Parts are display geometry rather than independently editable items or certified
engineering details. The existing catalog photo remains unchanged.
