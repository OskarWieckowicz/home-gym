# Phase 16 — Product visual assets and model families

## Objective

Turn the accepted Summit Power Cage benchmark into a small, coherent, reproducible equipment
library for the MVP. Produce only the model families that prove the main shared-planning demo,
cover the catalog's most important spatial behaviours, and provide enough visual variety for the
creator and catalog.

The phase produces GLB models, orthographic top-down renders, and deterministic catalog renders
from the same accepted source models. It does not turn rendered geometry into domain truth and it
does not require a unique mesh for every catalog product.

## Dependencies

- Phase 11 stable catalog IDs and product dimensions.
- Phase 12 deterministic equipment placement and geometric fallbacks.
- Phase 15 exit gate: the shared-store 3D scene loads `public/assets/squat-rack.glb` at the correct
  scale, orientation, and pivot, and a failed asset falls back safely.
- Accepted production direction in `docs/PRODUCT_VISUALS_STRATEGY.md`.
- Existing benchmark artifacts:
  - `scripts/generate-squat-rack-glb.mjs`;
  - `public/assets/squat-rack.glb`;
  - `public/assets/squat-rack-catalog.png`.

Phase 16 must not start batch production until the Phase 15 integration facts and the adjustable
bench gate below are accepted.

## Product-selection decision

Models are prioritized by demo value, spatial distinctiveness, family reuse, and production risk.
The current catalog does not need 32 unique GLBs.

### Tier 0 — required demo slice

| Product | Asset family | Reason |
|---|---|---|
| Summit Power Cage | full rack | Existing benchmark and current scene integration reference. |
| Arc Adjustable Bench | adjustable bench | Hard-family gate; proves angled pads, joints, wheels, and a recognizable non-box silhouette. |
| Quarry Power Bar | Olympic barbell | Required by the primary squat/bench/deadlift scenario and reusable by barbell products. |
| Foundry Bumper Plates | Olympic plates | Completes the strength station and proves repeated/instanced circular geometry. |
| Current Fold Bike | stationary bike | Provides the first compact cardio choice for the second half of the main demo scenario. |

Create a deterministic **strength-station composition fixture** showing the rack, bench, loaded
bar, and spare plates together for visual review and catalog/marketing renders. Do not ship the
composition as one placeable planner object: rack, bench, barbell, and plates retain independent
product IDs, prices, dimensions, selection, and history.

Before using that composition as a planner demo, explicitly decide how supported nesting is
represented. A bench inside a rack and a bar resting on J-cups are intentional relationships, not
ordinary accidental overlaps. Do not weaken global collision checks or hide warnings merely to
make the staged scene look valid. For the MVP, either:

1. keep the composition render-only and place independent products in non-overlapping planner
   positions, or
2. add a separately planned deterministic compatibility/mounting rule before demonstrating nested
   placements.

Option 1 is the Phase 16 default; option 2 expands domain behaviour and needs its own plan and
tests.

**Product decision — 29 August 2026:** the composition was subsequently approved as one placeable
catalog bundle under `product_summit_strength_station`. Its rack, bench, bar, and plates remain one
combined placement with a single deterministic footprint; they are not independently selectable
within the bundle. This does not introduce supported nesting between independent products and does
not weaken collision checks.

### Tier 1 — required MVP breadth

| Product | Asset family | Reason |
|---|---|---|
| Northstar Half Rack | half-rack variant | A more typical compact home-gym choice and a reuse test for the accepted rack language. |
| Pivot Flat Bench | flat-bench variant | Covers the simple bench case without creating a second unrelated family. |
| Range Adjustable Dumbbells | adjustable dumbbells with cradles | Covers compact free-weight training and is visually legible as one placeable product. |
| Anchor Pull-Up Bar | wall-mounted accessory | Proves a required-anchoring, wall-oriented visual rather than another floor-standing cuboid. |
| Surge Compact Treadmill | treadmill | Critical cardio silhouette and a strong clearance-zone demonstration. |
| Cairn Iron Plates | iron-plate variant | Reuses plate geometry while visibly distinguishing thin iron from bumpers. |

Tier 1 is produced in small batches only after Tier 0 passes in the live room.

### Deferred from the critical set

- A dedicated Olympic bench station is not in the current catalog and functionally overlaps the
  rack + bench + barbell scenario. Do not add it during Tier 0 or Tier 1. Reconsider it only if the
  catalog needs a lower-cost bench-press station or a hero visual that the modular station cannot
  communicate; adding it requires a product-data decision before asset work.
- Additional rack, bench, plate, dumbbell, and cardio SKUs reuse an accepted family or keep the
  geometric fallback until they become visible in the demo.
- Small accessories that do not materially occupy the room do not receive independent GLBs in this
  phase.

## Scope boundary

### MVP simplification decision — 29 August 2026

For the current MVP, an accepted procedural GLB, explicit runtime mapping, deterministic fallback,
measured runtime cost, and a generated top-down SVG are sufficient visual-family evidence. The SVG
is projected deterministically from the accepted GLB and displayed inside the catalog footprint;
domain geometry remains the 2D hit target and fallback. Deterministic catalog base renders and
five-angle capture sets are deferred to presentation polish. Existing catalog art or the
intentional catalog fallback is acceptable.

This decision supersedes catalog-render and multi-angle requirements in the adjustable-bench gate,
task 7, render-specific tests, and corresponding three-representation exit criteria. It retains a
narrow tested GLB-to-top-view pipeline. It does not relax GLB recognizability, bounds/pivot checks,
explicit product-ID mapping, load fallback, runtime cost, provenance, or the rule that mesh
geometry is not domain truth.

Included:

- an auditable mapping from every placeable product to an accepted family, variant, or fallback;
- reusable procedural geometry helpers instead of copying the complete rack generator;
- reproducible GLBs for Tier 0 and Tier 1 products;
- a render-only strength-station composition fixture;
- orthographic top-down SVGs projected deterministically from accepted GLBs;
- scene and catalog integration through explicit product IDs;
- optimization, provenance, visual review evidence, and missing-asset fallbacks.

Excluded:

- one bespoke mesh for every catalog SKU;
- photorealistic materials, animation, people, moving mechanisms, or physics;
- a single combined planner product for the full strength station;
- changing product dimensions to fit a generated mesh;
- deriving collisions, clearances, or placement validity from GLB bounds;
- independently prompted catalog art that is not based on the accepted model;
- adding an Olympic bench product without a separate catalog decision;
- licensed marketplace assets unless one procedural family fails its gate and provenance is clear.

## Visual and asset contract

Every accepted family or variant must record:

- the exact catalog product IDs it supports;
- generator script and generator revision;
- canonical dimensions used for review;
- metres as GLB units;
- floor contact at `y = 0`;
- object origin at the centre of the canonical floor footprint;
- canonical forward direction of negative Z;
- material palette and allowed variants;
- measured mesh bounds, triangle count, node count, material count, file size, and expected draw
  calls;
- catalog render, top-down render, and visual-review captures;
- provenance, including whether the mesh is procedural or externally sourced.

The product catalog remains the only source for price, dimensions, footprint, clearance, and
requirements. The scene scales or positions a visual against the catalog envelope; it never writes
measured mesh bounds back into product data.

For each GLB:

- no visible geometry may extend outside the canonical product envelope by more than 3 cm without
  a documented and accepted reason;
- floor contact and origin error must be at most 1 cm;
- all primitives must have normals and valid material references;
- repeated parts should be instanced during generation or merged by material before release;
- production models should target at most 24 renderable mesh nodes and 12 material groups; an
  exception requires a measured complete-room performance justification;
- each file should target 1 MB or less before optional transport compression; exceptions require a
  documented quality/performance trade-off;
- loading failure must retain the existing catalog-sized geometric fallback.

The current 251-node rack is benchmark evidence, not the production node-count standard. Optimize
it before using the same construction pattern for another rack variant. The current artifact also
needs a bounds audit: measured geometry is approximately 132 x 174 x 227 cm, the generator comment
declares 128 x 145 x 225 cm, and the runtime registry expects a 130 x 165 x 225 cm envelope. Resolve
that discrepancy before treating the rack as the dimensional reference for later families.

## Implementation tasks

### 1. Freeze the model manifest

1. Add a checked-in manifest that maps all placeable catalog product IDs to `family + variant`,
   `fallback`, or `not independently placeable`.
2. Record Tier 0 and Tier 1 status, source generator, outputs, measured facts, and provenance.
3. Validate that every product ID in the manifest exists and that every registered runtime asset
   has a manifest entry and output file.
4. Keep product-family metadata independent from domain dimensions and project persistence.

### 2. Extract a reusable procedural GLB toolkit

1. Extract box, cylinder, material, binary-buffer, bounds, and GLB-writing helpers from
   `generate-squat-rack-glb.mjs` into small offline-production modules.
2. Add reusable equipment subassemblies only where they genuinely share structure, such as pads,
   steel tubing, Olympic sleeves, plate discs, wheels, and rubber feet.
3. Preserve deterministic output for the same inputs.
4. Add mesh merging by material or another explicit optimization step so repeated details do not
   become hundreds of runtime nodes.
5. Keep each generator below the repository's 500-line source-file limit.

### 3. Rebuild and optimize the rack benchmark

1. Regenerate the Summit Power Cage through the shared toolkit without changing its accepted
   silhouette, pivot, orientation, or catalog mapping.
2. Compare before/after bounds, triangles, nodes, materials, file size, and render appearance.
3. Verify the optimized file in the Phase 15 room and keep the previous asset until the replacement
   passes visual and runtime review.
4. Derive the Northstar Half Rack only after the optimized full-rack family is accepted; do not
   create it by scaling the cage uniformly.

### 4. Pass the adjustable-bench gate

1. Generate the Arc Adjustable Bench with recognizable separate back and seat pads, frame,
   adjustment mechanism, feet, handle, and wheels.
2. Author one canonical displayed incline, while keeping the catalog footprint and stored product
   behaviour unchanged.
3. Inspect the GLB in the live room and approve recognizability, bounds, pivot, orientation, load
   fallback, and runtime cost before generating another family.
4. Generate its deterministic transparent top-down SVG from the accepted GLB. Defer catalog-base
   and five-angle evidence renders to presentation polish.
5. If the bench fails two focused procedural revisions, pause batch work and evaluate one clearly
   licensed sourced model for this family only.

### 5. Complete and verify the Tier 0 strength station

1. Generate the Quarry Power Bar as a reusable Olympic barbell family with distinct shaft, sleeves,
   collars, and restrained knurling detail.
2. Generate Foundry Bumper Plates from instanced/merged discs with readable plate thickness and
   hub detail; define the iron-plate variant without duplicating the entire generator. The catalog
   product represents a stored 100 kg set with a 45 x 36 x 45 cm footprint, while individual discs
   mounted on the bar are render-only subassemblies of the strength-station composition.
3. Create the render-only strength-station composition fixture with explicit transforms for rack,
   bench, loaded bar, and spare plates.
4. Review both the individual products and the composition from the canonical catalog, top-down,
   and room cameras.
5. Confirm that the composition fixture cannot enter project state or runtime collision logic.

### 6. Produce cardio and Tier 1 in risk-ordered batches

Produce and approve no more than two new families per batch:

1. Current Fold Bike as the first post-bench organic family and the Tier 0 cardio choice.
2. Northstar Half Rack and Pivot Flat Bench as variants of accepted families.
3. Range Adjustable Dumbbells and Anchor Pull-Up Bar.
4. Surge Compact Treadmill, then Cairn Iron Plates as the accepted plate-family variant.

After each batch, inspect actual room placement, fallback behaviour, catalog-card legibility,
top-down legibility, measured asset cost, and complete-room performance before continuing.

### 7. Generate MVP top-down projections

1. Project accepted GLB triangles orthographically from positive Y into transparent SVG with
   canonical negative-Z pointing toward the top.
2. Preserve source material colors, deterministic ordering, safe static markup, and tight bounds.
3. Keep selection, collision, clearance, labels, hit targets, and dimensions in application UI,
   not in the generated SVG.
4. Defer deterministic catalog-base rendering and any controlled AI polish until after the MVP.

### 8. Integrate explicit runtime mappings

1. Replace the one-product literal asset type with a validated manifest-derived registry while
   retaining explicit product-ID lookup.
2. Support family variants and visual material options without duplicating product dimensions.
3. Keep asset loading local to the client scene and retain per-placement error boundaries.
4. Add top-down and catalog-image lookup without coupling those assets to placement commands.
5. Confirm that missing files, unknown IDs, and invalid GLBs use intentional fallbacks and do not
   affect project validation.

## Acceptance criteria

- The Arc Adjustable Bench gate passes before any broad batch is generated.
- Tier 0 contains five independently mapped products: the four-part strength slice and the compact
  bike; the strength products also render as one non-placeable composition fixture.
- Northstar Half Rack, Pivot Flat Bench, adjustable dumbbells, wall pull-up bar, treadmill, bike,
  and iron plates have accepted Tier 1 visuals or an explicitly documented stop decision.
- Every placeable catalog item has a manifest decision: accepted family/variant or geometric
  fallback; no asset is selected by product-name guessing.
- Every accepted MVP visual family has one reproducible GLB, one deterministic top-down SVG, and an
  explicit runtime mapping or intentional fallback. Deterministic catalog-base renders are deferred.
- The catalog remains the source of all spatial and commercial truth.
- Bench/rack nesting is not silently enabled by weakening ordinary collision checks.
- Missing or failed assets leave 2D editing, 3D preview, WebMCP, history, and validation usable.
- Accepted GLBs meet the bounds/pivot contract and the node/file targets or record a measured
  exception.
- A representative room containing the strength setup, dumbbells, wall accessory, and one cardio
  machine remains responsive at the target demo viewport.
- Provenance and measured production facts are checked in for every released asset.

## Tests and verification

1. Add generator tests for deterministic bounds, normals, indices, buffer alignment, material
   references, GLB headers/chunks, floor pivot, and canonical orientation metadata.
2. Add manifest tests for catalog coverage, valid product IDs, unique output paths, existing files,
   allowed family/variant values, and runtime-registry agreement.
3. Add scene tests for each accepted mapping, family variant selection, and fallback on absent or
   failed assets.
4. Add top-view projection tests that verify deterministic transparent SVG output, material colors,
   canonical orientation, safe markup, and non-empty output.
5. Manually review every new family from at least five camera angles and at actual catalog-card and
   editor sizes; record accept/revise/reject in the manifest or review document.
6. Manually inspect the Tier 0 strength-station composition without treating it as a valid planner
   placement.
7. Measure a representative complete room and record assets loaded, triangles, draw calls, texture
   memory where applicable, and observed interaction responsiveness.
8. Run the narrowest generator, manifest, and scene checks after each batch.
9. Run `npm run quality:quick` after each coherent implementation slice.
10. Run `npm run agent:verify` and `npm run build` before the phase exit gate because this phase
    changes runtime assets and their client-side registry.

## Checkpoints

1. **Catalog checkpoint:** Tier assignments and the manifest cover the current catalog without
   adding an Olympic bench by accident.
2. **Toolkit checkpoint:** the optimized Summit cage matches the accepted benchmark in the live
   scene with materially fewer runtime nodes.
3. **Bench checkpoint:** Arc Adjustable Bench is recognizable and contract-compliant in GLB,
   top-down, and catalog render form.
4. **Tier 0 checkpoint:** the modular strength station and its render-only composition are accepted.
5. **Tier 1 batch checkpoints:** each two-family batch passes visual, contract, fallback, and runtime
   review before the next starts.
6. **Integration checkpoint:** explicit mappings, fallbacks, tests, complete-room measurement, local
   validation gate, and production build pass.

## Exit gate

Phase 16 ends when the Tier 0 strength slice and the approved Tier 1 families have reproducible
GLBs and top-down SVGs, intentional catalog art or fallbacks, explicit manifest decisions, and safe
missing-asset behavior. The complete-room measurement, `npm run agent:verify`, and `npm run build`
must pass, and no domain rule may depend on mesh geometry.

If deadline pressure prevents all Tier 1 assets, exit only with Tier 0 plus at least one free-weight,
one wall-mounted, and one cardio family; all remaining products must have intentional geometric and
catalog-image fallbacks recorded in the manifest.
