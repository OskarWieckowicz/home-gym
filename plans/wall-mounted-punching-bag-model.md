# Wall-mounted punching bag — model and catalog integration

User authorized the model, catalog integration and wall mounting with a blocked floor footprint.

## Agreed implementation slice

- Add a fictional Kiln Strength Wall-Mounted Punching Bag, 899 PLN. Envelope 60 × 120 × 190 cm; bottom 30 cm above floor, top 220 cm. Minimum ceiling 230 cm. Professional installation and suitable structural wall required. No load rating inferred from photo.
- Reserve the full 60 × 120 cm floor rectangle, including the area between wall and bag. Exercise margins: front 100 cm, sides 80 cm, rear 0 cm. These are fictional planner assumptions, not installation or swing-clearance certification.
- Reuse generic wall snapping, dragging, rotation, opening checks and presentation height. Explicitly opt this product into floor blocking without changing the elevated Anchor bar.
- Produce deterministic GLB: rounded black bag, seams, reinforced tabs, four chain runs, swivel, steel cantilever, twin braces, wall plates and bolts. Front negative Z, rear at +0.60 m, local bottom zero. Render layer applies 30 cm mounting lift.
- Map accepted photo, GLB and derived top SVG; preserve existing catalog identities and placements.

## Verification

- Focused tests: mounting on every wall, floor collision even with low objects, access blockage, opening conflicts, undo/redo, asset mappings and reproducibility/bounds.
- Inspect offline GLTFLoader front/rear renders; browser review remains paused.
- Run quality:quick, lint:report, agent:verify and build for the new catalog route.
- Required independent review of collision/access changes before completion.

## Progress

- Complete: catalog entry, accepted photo, detailed GLB and derived top SVG connected.
- Optional mounting.blocksFloor flag applied to collision and walking checks; Anchor unchanged.
- Asset reproduction/bounds, all-wall mounting, low obstacles, mat placement, access/suggestions,
  openings, shared WebMCP/manual history and elevation regressions pass.
- quality:quick and agent:verify passed (997 tests / 110 files); lint has 36 existing warnings,
  zero errors. Build and generated catalog page checks passed. Independent review found no defects.
- Offline front/rear previews inspected. Browser/GPU verification remains paused; no deployment.
- Durable details and metrics: [model documentation](../docs/WALL_MOUNTED_PUNCHING_BAG_MODEL.md).
