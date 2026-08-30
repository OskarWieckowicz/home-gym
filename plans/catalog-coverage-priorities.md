# Catalog coverage — proposed asset priorities

> Proposal for discussion, 30 August 2026. Not an approved generation queue.
> Scope: prioritize coverage and production effort; no runtime or catalog-data changes.

## Objective

Cover distinct home-training needs with the fewest additional equipment families.
Prioritize new training capabilities over further variants of racks, benches, bars, and plates.
Production-effort labels below are relative estimates, not measured generation times.

## Current evidence

Reviewed `src/data/products/`, `src/features/catalog/product-assets.ts`, `public/assets/`,
the product concept, and the product visuals strategy.

- Existing visual coverage is concentrated on barbell strength, with adjustable dumbbells,
  a pull-up bar, a treadmill, and a compact bike also represented.
- Loop Wall Cable Trainer, Rill Compact Rower, Signal Resistance Bands, Groundwork Mobility Kit,
  Orbit Suspension Trainer, Pulse Jump Rope, and Flex Studio Dumbbells already have seed records
  but no catalog-image mapping in the reviewed tree.
- There are no dedicated dip-bar or kettlebell seed records.
- Bands, suspension straps, jump rope, and the mobility kit currently use `placementMode: floor`.
  Only the wrist wraps use `selection-only` among the reviewed accessories.
- Loop is described as wall-mounted but lacks the explicit wall-mounting metadata used by Anchor.
  Resolve its intended mounting and exercise configuration before authoring its asset.

## Recommended minimum batch

| Priority | Product/family | Additional coverage | Asset scope | Relative effort |
|---|---|---|---|---|
| P0 | Signal Resistance Bands | Compact, inexpensive resistance work and assisted exercises | Catalog image only; propose selection-only | Low |
| P0 | Groundwork Mobility Kit | Floor exercise, mobility, warm-up; mat, roller, bands | One bundle image; propose selection-only | Low |
| P1 | Loop cable station | Cable resistance, rows, arm work, unilateral exercises | GLB, derived top view, catalog image | High |
| P1 | Freestanding dip bars, sold as one pair | Calisthenics pushing, support holds, L-sits | One paired GLB and footprint, top view, catalog image | Low–medium |
| P1 | Kettlebell | Loaded carries, swings, goblet squats; general strength and conditioning | One simple GLB family, top view, catalog image | Low–medium |
| P2 | Rill Compact Rower | Rowing and full-body conditioning; distinctive room-layout trade-off | GLB, top view, catalog image | Medium–high |

The smallest coherent target is **three new 3D families plus two accessory images**.
The rower is the first optional fourth family. Treadmill and bike already provide cardio coverage.

## Product decisions before generation

- Cable station: prefer one compact adjustable-height pulley column over a large dual-column
  crossover for this batch. High and low cable work must match actual pulley travel and handles.
  Do not claim a dedicated heavy lat-pulldown configuration without the necessary seat/restraint
  and product specification. Preserve the existing Loop identity where its specification fits.
- Dip bars: choose freestanding high parallel bars rather than another pull-up tower. Model the
  pair as one product with one planning envelope. Do not introduce rack-attachment dependencies.
- Kettlebell: start with one representative product, not separate bespoke meshes for many weights.
  Its physical storage footprint must not be presented as proof that swings or carries fit there.
- Mobility kit: use one image for the bundle; do not initially create separate roller, yoga block,
  and mat product images. A deployed mat that reserves exercise space is a separate planning
  decision, not equivalent to the existing rolled/stored kit dimensions.

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

1. Confirm the three-family cut and cable-station configuration before generation.
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
