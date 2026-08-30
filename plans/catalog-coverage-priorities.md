# Optional catalog coverage — unresolved proposals

> Updated: 30 August 2026. Not an approved generation queue.
> These ideas are separate from the submission queue. Specifications and production approval
> are required before implementation; cleanup does not authorize new products or assets.

## Candidate work

| Candidate | Remaining decision / work |
|---|---|
| Compact dual-pulley station | Completed after explicit photo, model and integration requests on 30 August. Separate `product_compact_dual_pulley_station` catalog entry with [catalog concept v1](../public/assets/compact-dual-pulley-station-catalog-concept-v1.png), [GLB](../public/assets/compact-dual-pulley-station.glb) and [derived top view](../public/assets/compact-dual-pulley-station-top.svg) mapped. [Provenance and fictional planning assumptions](../docs/COMPACT_DUAL_PULLEY_MODEL.md). Loop unchanged; browser review remains paused. |
| Separate single-column cable machine | One-handle [photo v2](../public/assets/single-column-cable-machine-catalog-concept-v2.png), [GLB](../public/assets/loop-cable-trainer.glb) and [top view](../public/assets/loop-cable-trainer-top.svg) mapped to existing `product_loop_cable_trainer` after user requests. Identity, price, dimensions and saved-project behavior unchanged. [Model provenance and checks](../docs/LOOP_CABLE_TRAINER_MODEL.md); [image prompt](../scripts/catalog-image-provenance/single-column-cable-machine-concept-v2.json). V1 photo retained as superseded history; browser review remains paused. |
| Freestanding dip bars | Completed after approval of adjustable photo v2 and explicit model/integration request. [Photo v2](../public/assets/freestanding-dip-bars-catalog-concept-v2.png), [GLB](../public/assets/freestanding-dip-bars.glb) and [top SVG](../public/assets/freestanding-dip-bars-top.svg) mapped to `product_freestanding_dip_bars`. Pair is one product/footprint with no rack dependency; static visible height adjustment. [Fictional specifications and checks](../docs/FREESTANDING_DIP_BARS_MODEL.md). V1 retained as history; browser review remains paused. |
| Groundwork Exercise Mat | Completed after explicit model request: deployed [GLB](../public/assets/groundwork-exercise-mat.glb) and [top SVG](../public/assets/groundwork-exercise-mat-top.svg) mapped alongside existing photo. Charcoal rounded mat with orange border; unchanged 65 × 180 × 1 cm floor footprint. [Model details](../docs/GROUNDWORK_EXERCISE_MAT_MODEL.md). |
| Wall-mounted punching bag | [Photo v1](../public/assets/wall-mounted-punching-bag-catalog-concept-v1.png), [GLB](../public/assets/wall-mounted-punching-bag.glb) and [top SVG](../public/assets/wall-mounted-punching-bag-top.svg) mapped to new `product_wall_mounted_punching_bag` after explicit user request. Wall mounting with `blocksFloor: true` reserves the full floor footprint; Anchor behavior unchanged. [Fictional specifications, behavior and verification](../docs/WALL_MOUNTED_PUNCHING_BAG_MODEL.md). Browser review remains paused. |
| Signal Resistance Bands | Photo mapped; selection-only per explicit user clarification. No model needed. Legacy placements retained as shopping items; [compatibility plan](signal-bands-selection-only.md). |
| Orbit suspension trainer, Pulse jump rope | Proposed selection-only conversion needs an explicit compatibility decision for existing placed items. Suspension/rope catalog imagery remains optional. |
| Rill Compact Rower | Optional next cardio family, with its own validated footprint and exercise clearances. |
| Flex Studio Dumbbells | Accepted [photo v1](../public/assets/flex-studio-dumbbells-catalog-concept-v1.png), [GLB](../public/assets/flex-studio-dumbbells.glb) and [top SVG](../public/assets/flex-studio-dumbbells-top.svg) mapped to existing `product_flex_studio_dumbbells`. Three colorful pairs; compact static display within unchanged catalog dimensions. [Model and verification](../docs/FLEX_STUDIO_DUMBBELLS_MODEL.md). Browser review remains paused. |

Do not restart the completed bands photo, kettlebell product/photo/model/top-view work, or mat/roller
product/photo integration. The user stopped kettlebell refinement; browser asset review remains
paused. Existing Mobility Kit identity stays intact. Roller and bands are selection-only; the mat
remains floor-placeable. Durable implementation facts live in seeds, asset registries,
provenance and tests, not in this proposal.

## Cable-machine decisions to preserve

- [Dual-pulley reference](../docs/cable-station-reference.png): two front rails with adjustable
  pulley carriages and individual handles, upper frame with multi-grip pull-up bar, rear stack
  enclosure and splayed feet. This is a complete station, not a rack attachment.
- [Single-column reference](../docs/cable-column-reference.png): one adjustable front carriage,
  selectorized stack and guide rods, upper cable routing, handles and a small base. Rear brackets
  suggest wall attachment; visible feet do not establish safe freestanding use. No integrated
  pull-up bar and no assumption of independent resistance channels from two handles.
- Keep the two configurations distinct. Use a separate identity for the wider station; do not
  reuse Loop's narrow footprint for it. Inspect saved-project references before changing Loop.
- Photographs select form only, not dimensions, load limits, pulley ratios, stack count, anchoring
  or price. Define fictional specifications and working room before authoring geometry.
- Preserve recognizable structure in our own styling without manufacturer branding or copied
  exercise charts. Do not claim dedicated heavy seated lat-pulldown capability without restraint.
- Shared pulley/frame helpers may reduce production effort, but review each complete asset
  separately. Selection of the forms is not approval to generate either asset.

## Before any approved implementation

1. Confirm the specific product/asset slice and budget; reconcile with the paused
   [catalog photo queue](phase-16-catalog-images.md).
2. Specify dimensions, exercises, use zones, mounting, placement mode and fictional price.
   Storage fit or selection-only status does not validate dynamic exercise space or anchors.
3. Preserve existing IDs and placements; do not silently remove or split Mobility Kit or
   discard placements when changing an accessory to selection-only.
4. Reuse the existing asset pipeline and record provenance. Image-only exceptions and any
   new production batch require explicit approval.
5. Add proportionate catalog, mapping, placement and compatibility tests; follow the repository
   validation ladder. Retain the browser-review pause unless the user resumes it.

Further equipment families and weight variants are outside this proposal. Resume only at the
user's request; these options must not delay the demo, landing polish or submission.
