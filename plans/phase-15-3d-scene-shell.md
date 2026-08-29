# Phase 15 — 3D scene shell and squat-rack vertical slice

## Objective

Prove the complete in-application path from the shared project store to a navigable 3D room using
the accepted squat-rack GLB. The slice must show real project geometry, one real equipment asset,
and deterministic fallback solids before the project invests in the remaining visual families.

This phase tests application integration rather than model-production quality: client-only WebGL,
domain-to-scene transforms, GLB loading, asset orientation and scale, fallback behavior, and the
invariant that 2D, WebMCP, and 3D observe the same project state.

## Dependencies

- Phase 12 deterministic room, obstacle, wall-element, and equipment-placement state.
- Phase 13 completed before this phase begins, so the active implementation queue remains serial.
- Accepted visual decision and baseline artifacts:
  - `scripts/generate-squat-rack-glb.mjs`;
  - `public/assets/squat-rack.glb`;
  - `public/assets/squat-rack-catalog.png`;
  - `spike/product-visual-assets-research.md`.

## Scope boundary

Included:

- an enabled 2D/3D view switch on `/creator`;
- transient `viewMode` UI state that is not part of `GymProject`, history, persistence, or WebMCP;
- a client-rendered React Three Fiber scene reading the existing Zustand project store;
- perspective camera, orbit, zoom, neutral lighting, floor, and room walls;
- physical obstacles as cuboids using stored position, rotation, dimensions, and height;
- unavailable zones as flat translucent rectangles;
- doors and windows as minimal wall markers without cutting wall geometry;
- one real GLB mapped explicitly to `product_summit_power_cage`;
- catalog-dimension cuboids for all placements without an accepted asset;
- a safe geometric fallback when an asset is missing, invalid, or fails to load;
- measured loading/render facts for the current rack, including its 251 mesh nodes.

Excluded:

- editing, dragging, rotating, or placing entities directly in 3D;
- a second project model or synchronization layer for the scene;
- collision, clearance, or validation derived from rendered meshes or raycasting;
- selection outlines, validation colors, dimensions, labels, or activity UI inside the canvas;
- true wall openings, door swing, window height, ceiling geometry, room textures, HDR lighting,
  postprocessing, or marketing-quality shadows;
- simultaneous 2D and 3D views;
- production of the adjustable bench or the remaining visual families;
- refactoring the primary SVG `RoomPlan` into React Three Fiber.

## Architecture decisions

- Keep two presentation adapters: the existing SVG 2D editor and a new R3F 3D preview.
- Both adapters subscribe to the same `GymProject` in the existing store and reuse deterministic
  catalog/domain data; neither copies project state into a renderer-specific store.
- Keep Three.js types and calculations out of project schemas, commands, validation, persistence,
  and WebMCP handlers.
- Put coordinate conversion, asset lookup, and visual sizing behind small testable scene modules.
- Treat centimeters in the domain and meters in the scene as an explicit conversion boundary.
- Keep precise editing in 2D. The Phase 15 scene is a read-only spatial review surface.

## Implementation tasks

### 1. Confirm framework boundaries

1. Read the relevant installed Next.js guidance under `node_modules/next/dist/docs/` before adding
   a client-only WebGL boundary or changing component composition.
2. Add compatible `three`, `@react-three/fiber`, `@react-three/drei`, and required type packages
   using versions compatible with the repository's React 19 and Next.js versions.
3. Keep the canvas behind a client component and ensure the creator route remains buildable when
   WebGL is unavailable during server rendering or tests.

### 2. Define pure scene transforms

1. Add a pure domain-to-scene transform that converts stored centimeter positions into a
   consistently centered meter-based room coordinate system.
2. Cover room dimensions, object centers, width/depth swaps, heights, and rotations
   `0 | 90 | 180 | 270` without importing Three.js into domain code.
3. Reuse catalog product dimensions for fallback equipment solids and visual envelopes.
4. Document the canonical GLB forward direction, floor pivot, and scale assumptions.

### 3. Add the scene shell

1. Make the toolbar switch controlled by transient editor UI state and render either `RoomPlan` or
   the 3D scene in the central workspace.
2. Build a responsive canvas with a perspective camera, orbit controls, zoom limits, neutral
   ambient/key lighting, and a floor derived from `project.room`.
3. Render walls from room width, depth, and height in a way that preserves room readability while
   orbiting.
4. Render obstacles, unavailable zones, and minimal door/window markers from the current project.
5. Keep all controls and accessible descriptions in ordinary DOM outside the canvas.

### 4. Integrate the squat-rack asset

1. Add a typed visual-asset registry mapping only `product_summit_power_cage` to
   `/assets/squat-rack.glb`; do not infer assets from category or product name.
2. Measure the GLB bounds and normalize its scale, floor pivot, and forward direction against the
   Summit Power Cage's canonical 130 x 165 x 225 cm visual envelope.
3. Render every other placement as a neutral cuboid derived from canonical catalog dimensions.
4. Recover from an unknown product, missing registry entry, loader failure, or invalid GLB with the
   same cuboid path rather than breaking the scene.
5. Record the rack's file size, bounds, mesh/material counts, observed draw calls, load behavior,
   and any visible mismatch with the catalog product.

### 5. Verify shared state and resilience

1. Prove that switching views does not dispatch a project command, increment revision, or alter
   undo/redo.
2. Prove that a placement moved or rotated in 2D or through a store/WebMCP command appears at the
   matching location and rotation in 3D without a synchronization step.
3. Confirm that a scene or WebGL failure leaves the primary 2D editor usable.
4. Keep asset failures local and observable without turning them into domain validation issues.

## Acceptance criteria

- The toolbar switches between the existing editable SVG plan and a navigable read-only 3D room.
- Switching views leaves `GymProject`, revision, history, persistence, and WebMCP state unchanged.
- Floor, walls, obstacles, unavailable zones, and wall markers reflect the current project state.
- A pure tested conversion maps domain centimeters and cardinal rotations into scene meters.
- A placed Summit Power Cage displays the real squat-rack GLB with a correct floor pivot, scale,
  position, and orientation.
- Other equipment displays deterministic catalog-sized cuboids.
- Missing or broken assets fall back to cuboids and cannot break the scene or 2D editor.
- A mutation made through the existing shared store is visible in both views from the same project
  revision without copied state.
- Orbit and zoom work on desktop and narrow layouts for one GLB plus representative fallback solids.
- The current rack's runtime cost and visual mismatch are recorded before it is duplicated.

## Tests and validation

1. Add focused unit tests for centimeter-to-meter conversion, centering, rotations, dimensions,
   and the typed asset registry.
2. Add component tests for the 2D/3D switch, unchanged project revision/history, and fallback
   selection with the WebGL canvas mocked at the boundary.
3. Add an integration test proving that a shared placement update feeds both presentation adapters.
4. Manually inspect a representative project with the Summit Power Cage, physical obstacles,
   unavailable zones, doors/windows, and at least one fallback equipment solid.
5. Manually verify orbit, zoom, responsive sizing, GLB load, orientation, and loader failure.
6. Run the narrowest affected tests, then `npm run quality:quick`.
7. Run `npm run agent:verify` before declaring the phase complete.
8. Run `npm run build` because this phase changes dependencies and client/rendering boundaries.

## Exit gate

The phase ends when the public creator can show the current shared project in both SVG 2D and R3F
3D, the real squat-rack asset works in context, all missing assets degrade to deterministic solids,
and the canonical local gates plus production build pass.

Afterward, advance to Phase 16. Start its visual production with the Arc Adjustable Bench as the
difficult-family gate; do not batch the remaining models until that benchmark passes in the new
scene shell.
