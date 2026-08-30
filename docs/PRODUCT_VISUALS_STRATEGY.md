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

The [asset plan](../plans/phase-16-product-visual-assets.md) owns remaining coverage, bounds,
loader-failure and runtime checks, including the existing browser-review pause and stopped
kettlebell refinement. This strategy does not authorize new image batches, purchases or review.

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
  cuboid for failed loads; unregistered products also use geometric fallback.
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
The generators are authoring tools, not runtime dependencies.

Run the individual generator documented with a model, then `npm run assets:top-views` to rebuild
derived SVGs. [inspect-glb.mjs](../scripts/inspect-glb.mjs) reports current bounds, triangles,
nodes, primitives, materials, file size, normals, generator metadata and SHA-256. Use this output
for current measurements instead of retaining an ever-growing census in documentation.
[render-product-reference.mjs](../scripts/render-product-reference.mjs) provides offline preview
images; the model records show reproducible front/rear commands where applicable.

## Accepted visual exceptions and compositions

### Summit Power Cage

[squat-rack.glb](../public/assets/squat-rack.glb) uses the accepted per-material merged geometry.
Its unscaled measured envelope is approximately 132 × 174 × 227 cm (width × depth × height),
whereas the catalog remains 130 × 165 × 225 cm. The explicit runtime scale `[1.016, 1, 1.04]`
preserves the accepted appearance; it is not exact normalization to the catalog envelope.
The appearance is accepted, but reconciling these bounds remains open in the asset plan.
Do not silently compensate in domain geometry or derive a family variant by uniform scaling;
Northstar already has its own generator and unit-scale mapping.

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

The [composition generator](../scripts/generate-strength-station-composition-glb.mjs) retains the
rack at the origin, rotates the bench 180 degrees beneath the bar, positions the bar at
`[0, 1.453, -0.59]` with shaft height 1.48 m, mounts four display discs on the sleeves and places
the spare-plate set at `[0.95, 0, 0.35]`. The derived top view uses the bundle's single catalog
footprint for selection and placement. These display arrangements are not independently editable.
