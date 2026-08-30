# Catalog coverage — proposed asset priorities

> Proposal for discussion, 30 August 2026. Not an approved generation queue.
> Scope: prioritize coverage and production effort; no runtime or catalog-data changes.

## Approved slice — Signal Resistance Bands image

On 30 August 2026 the user approved generating the P0 resistance-bands image only.
Generate one image with the built-in image tool, save it in `public/assets/`, record its prompt
and provenance, map it to the existing product, and verify the mapping plus local quality gates.
No GLB, top view, other product, or placement-mode change is part of this slice.
The wider priorities below remain proposals; the image-only production exception is approved
for this product. Existing seed records and project placement compatibility are unchanged.

## Approved slice — single 16 kg kettlebell

The user approved one 16 kg kettlebell as the first product and its catalog photo.
Working identity: Forge Kettlebell 16 kg, brand Kiln Strength, category accessories, one unit.
Fictional MVP assumptions: PLN 299; 21 × 18 × 28 cm W × D × H storage envelope; 30 cm on each
side for access only. Explicitly warn that swings/carries need a separate unobstructed exercise
area, which this stored placement does not validate. No change to the geometry engine.

1. Generate one charcoal cast-iron kettlebell catalog image with subtle orange handle accents
   and a legible 16 KG marking, using built-in imagegen. Record prompt and provenance.
2. Add one seed and explicit image mapping; preserve all existing product identities. Update the
   strict catalog distribution from 34 to 35 products (8 accessories); keep its validation strict.
3. Test the product specification, search, image mapping, and shared project selection/placement.
4. Run focused tests, `quality:quick`, advisory `lint:report`, and `agent:verify`.
   No route, component boundary, or build configuration changes are planned.

The user subsequently requested the 3D model in the same work session. Extend this slice:

5. Generate a reproducible GLB matching the accepted photo, with a rounded body, flat floor base,
   open arch handle and orange collars, within 21 × 18 × 28 cm. Reuse the offline procedural toolkit
   and merge geometry per material; do not change domain dimensions or collision rules.
6. Register the model with identity scale and negative-Z front; derive a transparent top view
   from the actual GLB and add it to the existing regeneration batch.
7. Verify loading, dimensions, floor contact, handle opening, normals, draw-call/triangle budget,
   deterministic output and registry mapping. Inspect front/rear structural renders and top view.
   Repeat the quality gates after integration. Preserve the existing browser-check pause.

Exit: product, photo, GLB and top view available through existing consumers; additional weights
remain deferred. Record measured asset facts and visual-review limitations in provenance.

## Objective

### Approved slice — add standalone mat and roller

User requested stopping kettlebell refinement and adding the two photographed products.
Keep the existing kettlebell model unchanged. Add Groundwork Exercise Mat (PLN 129, deployed
65 × 180 × 1 cm, floor placement) and Groundwork Foam Roller (PLN 89, 33 × 14 × 14 cm,
selection-only). These prices/dimensions are fictional MVP defaults. Reuse their existing images;
no new image or model generation. Retain the existing Mobility Kit identity for saved projects.
Update strict catalog counts to 37 total / 10 accessories, add image mappings and focused tests
for selection-only rejection, mat placement, search and pricing; run quality gates.

Cover distinct home-training needs with the fewest additional equipment families.
Prioritize new training capabilities over further variants of racks, benches, bars, and plates.
Production-effort labels below are relative estimates, not measured generation times.

## Current evidence

Reviewed `src/data/products/`, `src/features/catalog/product-assets.ts`, `public/assets/`,
the product concept, and the product visuals strategy.

- Existing visual coverage is concentrated on barbell strength, with adjustable dumbbells,
  a pull-up bar, a treadmill, and a compact bike also represented.
- Loop Wall Cable Trainer, Rill Compact Rower, Groundwork Mobility Kit,
  Orbit Suspension Trainer, Pulse Jump Rope, and Flex Studio Dumbbells already have seed records
  but no catalog-image mapping in the reviewed tree.
- Signal Resistance Bands now has a generated catalog image and mapping; placement is unchanged.
- Forge Kettlebell 16 kg now has a single-unit seed and generated catalog image; dip bars remain pending.
- Bands, suspension straps, jump rope, and the mobility kit currently use `placementMode: floor`.
  Only the wrist wraps use `selection-only` among the reviewed accessories.
- Loop is described as wall-mounted but lacks the explicit wall-mounting metadata used by Anchor.
  Resolve its intended mounting and exercise configuration before authoring its asset.

## Recommended minimum batch

| Priority | Product/family | Additional coverage | Asset scope | Relative effort |
|---|---|---|---|---|
| P0 | Signal Resistance Bands | Compact, inexpensive resistance work and assisted exercises | Catalog image only; propose selection-only | Low |
| P0 | Standalone foam roller (working name: Groundwork Foam Roller) | Foam rolling and warm-up accessory, independently selectable | Catalog image only; propose selection-only | Low |
| P0 | Standalone exercise mat (working name: Groundwork Exercise Mat) | Floor exercise and mobility, independently selectable | Catalog image; propose a simple deployed-mat GLB and top view for floor placement | Low |
| P1 | Compact dual-pulley cable station | Adjustable high/low cable work, bilateral and unilateral exercises, integrated pull-up bar | GLB, derived top view, catalog image | High |
| P1 | Compact single-column cable machine (Loop candidate) | Narrow alternative with height-adjustable cable outlet for high/low accessory work | Separate GLB, derived top view, catalog image; reuse cable subassemblies | Medium |
| P1 | Freestanding dip bars, sold as one pair | Calisthenics pushing, support holds, L-sits | One paired GLB and footprint, top view, catalog image | Low–medium |
| P1 | Kettlebell | Loaded carries, swings, goblet squats; general strength and conditioning | One simple GLB family, top view, catalog image | Low–medium |
| P2 | Rill Compact Rower | Rowing and full-body conditioning; distinctive room-layout trade-off | GLB, top view, catalog image | Medium–high |

The revised target is **four equipment models (two cable configurations, dip bars, kettlebell)
plus a simple mat representation**, with
separate catalog images for bands, roller, and mat. The bands image is already generated.
The user also approved the standalone roller photo on 30 August: its generated asset is
`public/assets/groundwork-foam-roller-catalog.png`, with prompt and review recorded in
`scripts/catalog-image-provenance/groundwork-foam-roller.json`. Its standalone selection-only
catalog record is now added; the existing multi-item Mobility Kit remains unchanged.
The standalone mat photo was also approved and generated on 30 August:
`public/assets/groundwork-exercise-mat-catalog.png`, with prompt and review in
`scripts/catalog-image-provenance/groundwork-exercise-mat.json`. Its standalone floor-placeable
catalog record is now added. GLB and top view remain deferred; the geometric fallback is used.
The rower is the next optional equipment family. Treadmill and bike already provide cardio coverage.

## Product decisions before generation

- Cable station: on 30 August the user selected a compact dual-pulley functional-trainer form,
  then also requested a separate single-column alternative (see below). Retain both. Use the supplied
  [visual reference](../docs/cable-station-reference.png): two front upright rails with
  height-adjustable pulley carriages and individual handles, an upper connecting frame with
  multi-grip pull-up bar, rear weight-stack enclosure, and splayed floor feet.
  This is one complete floor-planned product, not a rack attachment or a wide commercial crossover.
- Cable asset: preserve that recognizable configuration in our own catalog styling, without
  copying the reference's manufacturer logos, model lettering, or printed exercise chart.
  This is approval of the equipment form, not a request to generate its assets yet.
- Cable specifications: do not infer exact dimensions, stack count, load rating, pulley ratio,
  anchoring requirements, or clearances from the image. Define and validate the fictional product
  specification before generation. Include working room in front and beside the handles and
  overhead clearance for pull-ups; the frame footprint alone is not the exercise envelope.
  Do not claim a dedicated seated heavy lat-pulldown station without the necessary seat/restraint.
- Second cable machine: use the supplied [column reference](../docs/cable-column-reference.png)
  for a separate narrow tower with one height-adjustable front pulley carriage, a visible
  selectorized weight stack and guide rods, upper cable routing, handles, and a small floor base.
  Rear brackets suggest wall attachment; verify the intended mounting specification rather than
  treating the visible feet as evidence that it is safe freestanding. No integrated pull-up bar.
  Do not infer independent resistance channels from the two visible handles.
- Product distinction: the dual-pulley brama is the wider two-sided option; the column is the
  compact alternative. Do not depict the latter as a replacement with identical capabilities.
  Both need working clearance beyond their stored footprint. Dimensions, loads, pulley mechanics,
  mounting, and fictional pricing remain to be specified, not measured from these photographs.
- Existing Loop Wall Cable Trainer is the candidate identity for the narrow column, subject to
  validating its dimensions and adding consistent mounting metadata. Create a separate identity
  for the dual-pulley station; do not reuse Loop's 62 × 28 cm footprint for it. Check saved-project
  compatibility before changing existing Loop dimensions or behavior.
- Production cost: share authored pulley, carriage, guide-rod, stack, handle, and frame helpers
  between the cable models, but generate and review each complete configuration independently.
  The second reference expands the planned set by one model and one catalog image; neither cable
  asset is authorized for generation by this planning update alone.
- Dip bars: choose freestanding high parallel bars rather than another pull-up tower. Model the
  pair as one product with one planning envelope. Do not introduce rack-attachment dependencies.
- Kettlebell: start with one representative product, not separate bespoke meshes for many weights.
  Its physical storage footprint must not be presented as proof that swings or carries fit there.
- Mobility kit: following the user's 30 August direction, plan separate roller and mat products,
  each with its own price, description, and image. Bands remain the existing separate Signal
  product; do not generate a combined kit image or duplicate the bands in a new bundle.
- Roller: propose selection-only with no GLB or top view. This does not validate space for use.
- Mat: propose floor placement in its deployed state, with an inexpensive thin-mat GLB and top
  view. Its dimensions must describe the unfolded mat, not the old kit's stored envelope.
  Placement is a proposal, not yet implemented; it does not certify clearance for every exercise.
- Before replacing the existing kit in catalog data, inspect saved-project references and choose
  explicit compatibility handling. Do not silently delete or split users' existing kit items.
  This turn updates priorities only; product creation, placement changes, and generation are pending.

## Next inexpensive coverage, if time remains

1. Orbit Suspension Trainer: catalog image and proposed selection-only behavior; keep the
   load-rated anchor requirement visible, without implying that the planner verifies an anchor.
2. Pulse Jump Rope: catalog image and proposed selection-only behavior; preserve overhead-space
   and exercise-area caveats. Useful conditioning coverage without another cardio machine.
3. Flex Studio Dumbbells: lighter-load option for general fitness; reuse compatible dumbbell
   construction where practical. Do not imply medical or rehabilitation suitability.
4. Later specialties: low parallettes or gymnastic rings, step/plyometric box, sandbag or slam ball.
   Rings require anchoring considerations; dynamic drills need more space than stored objects.

## Defer

Further rack/bench/bar/plate variants, another bike or walking pad, dedicated isolation machines,
SkiErg, sled, battle ropes, punching bag, and Pilates reformer. These may serve particular users,
but add less broad coverage per production effort or bring installation/dynamic-space complexity.
Do not claim this batch fully supports every sport, accessibility need, or rehabilitation use case.

## Implementation checkpoints after approval

1. Confirm the expanded production budget and both cable-machine specifications before generation;
   the dual-pulley station and single-column forms are selected above.
2. Write the approved implementation slice under `plans/`; reconcile rather than overwrite the
   existing asset queue. Preserve concurrent image and catalog work.
3. Finalize dimensions, mounting, exercises, use zones, and placement mode before model authoring.
   For selection-only changes, inspect persisted projects and existing placements before choosing
   compatibility behavior; do not silently discard placed user items.
4. Produce one family at a time using the existing reproducible GLB pipeline. Reuse that geometry
   for top views and catalog references; no independent redesign in the polished image.
5. For selection-only accessories, omit runtime GLB and top view. An image-only production path
   is a proposed exception to the default GLB-derived workflow and needs approval before use.
6. Verify new products through shared UI/domain/WebMCP operations, budget and summary coverage,
   mounting/placement restrictions, and visual review. Selection-only is not exercise-space
   validation; retain clear requirements instead of treating zero floor occupancy as zero need.
7. Add proportionate catalog, asset-contract, placement, and persistence tests. Run narrow tests,
   `npm run quality:quick`, then `npm run agent:verify`; add `npm run build` if relevant boundaries
   or deployment-sensitive code change. No implementation gates were run for this proposal.

## External reference checks

These illustrate equipment distinctions; they are not sources for fictional product dimensions.

- [Rogue FM-6](https://www.roguefitness.com/rogue-fm-6-functional-trainer-add-on) distinguishes an
  adjustable functional trainer from dedicated lat-pulldown and low-row configurations.
- [Concept2 RowErg](https://www.concept2.com/ergs/rowerg) provides a real rowing-equipment reference
  with separate space recommendations; Rill must retain its own validated specification.
