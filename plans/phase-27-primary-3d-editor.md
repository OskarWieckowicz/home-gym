# Phase 27 — 3D as the primary project editor

> Order 1 in the [active queue](README.md). Implementation delivered locally; final device and public-deployment acceptance remains open.
> Product decision: 30 August 2026. Runs before Phase 26; does not depend on its demo fixture.
> Uses the existing scene, catalog solids/GLBs, project commands and shared store.

Implementation and verification evidence: [Phase 27 verification](../docs/PHASE_27_3D_EDITOR_VERIFICATION.md).
Keep this plan in the active queue until its full exit gate, including the public build, passes.

**Interaction amendment, 30 August 2026:** the user subsequently replaced the explicit Edit/Navigate
baseline below with [contextual gestures](phase-27-unified-gestures.md). That follow-up supersedes
the mode-toggle requirements here: click selects, drag an already-selected entity moves it,
and drag elsewhere orbits without changing selection. Other safety/acceptance requirements remain.

## Outcome

Make 3D the default working view, not a read-only preview. A person can create a room layout,
add equipment and room elements, select, move, edit, rotate, unplace and remove them, then
continue with an agent without switching to 2D. Keep 2D as a precise alternative and a working
fallback. Both views and WebMCP operate on one project and one undo/redo history.

This explicitly supersedes the current product/UI rule that 2D is for design and 3D only for
review. It does not expand the domain into full 3D CAD. Phase 22's activity feed remains cut.

## Current code and reuse boundary

- `src/features/creator/components/creator-editor.tsx` owns selection, placement modes, inspector
  forms and the view switch. It starts in 2D and passes only project/selection/issues to 3D.
- `src/features/creator/scene/scene-preview.tsx` supplies Canvas, room surfaces, lights and
  OrbitControls. It has no editing handlers. Entity rendering, GLB fallbacks, use zones and
  validation outlines already live in `scene-equipment.tsx` and `scene-entities.tsx`.
- `scene/scene-transform.ts` converts domain centimetres/min-corners to centred scene metres.
  It needs a tested inverse for pointer targets, not mesh-derived project geometry.
- `plan/place-equipment.ts` already builds new-product and existing-item placement commands,
  rejects selection-only products and handles wall mounting. Reuse it.
- `plan/placement-target.ts` provides centring and the floor/wall target contract. Its SVG hit
  calculation is renderer-specific. `room-plan.tsx` privately owns room-element command builders
  and defaults; extract those rather than copy them into 3D. That file is already 481 lines.
- Existing room/settings/obstacle/placement/wall-element/project-item forms provide exact editing,
  removal, rotation, lock controls where supported, and the unplace/remove distinction.
- `geometry/wall-mounting.ts` owns mounting rules. `constrainMountedDrag` checks an already-flush
  position; it does not project arbitrary pointer movement onto a wall.
- The per-model asset boundary is not a whole-Canvas failure boundary. Making 3D primary requires
  a separate recovery path for unavailable WebGL, scene failure and context loss.

## Scope

In scope:

- Default 3D workspace with floor/wall targeting, selection and the existing inspector.
- Click-to-place from the palette, catalog and existing unplaced project items; desktop catalog
  drag-and-drop parity using the current product payload.
- Transient placement preview; floor dragging for equipment, physical obstacles and unavailable
  zones; along-wall dragging for doors/windows and wall-mounted equipment.
- Existing editing, rotation, deletion, unplacement, budget/settings, undo/redo, import/export
  and WebMCP workflows while 3D is active.
- Deliberate camera/edit gesture ownership, keyboard and touch alternatives, responsive layout,
  reliable asset-independent picking, validation visibility and whole-scene recovery to 2D.
- Camera-relative wall cutaway: near-side walls do not obscure the workspace, while their floor
  outline and explicit wall-editing targets remain available.

Out of scope:

- Arbitrary rotation, vertical dragging, stacking, mesh resizing, gizmos for three-axis transforms,
  multi-selection, physics, walkthrough mode, irregular rooms or new domain constraints.
- New product assets or asset batches, activity feed, chat, model calls or new WebMCP tools.
- Changes to project schema, serialization, storage keys, validation rules or equipment lock fields.
- Demo bootstrap/start URLs (Phase 26), landing/catalog polish (Phase 23), video/submission (24).

The geometric asset fallback is permanent. Completion does not depend on finishing Phase 16.

## Interaction contract

| Action | Required behaviour |
|---|---|
| Open creator | Default to 3D after the existing project restoration; 2D switch remains available during loading and failure. |
| Select | Primary click/tap on a physical entity selects its domain ID and opens the existing inspector. Empty-space click clears selection; camera movement does not. |
| Add | Choose a palette tool/product, preview its actual command target, click/tap a valid floor/wall target, create once and select it. Escape or Cancel exits without mutation. |
| Drag on floor | Move an unlocked obstacle/zone or equipment in X/Z only, preserving the grab offset and existing snapping semantics. Commit once on release. |
| Drag on wall | Change only the along-wall position. Doors/windows retain their wall; mounted equipment retains mounting wall/rotation. Change walls through existing editing/replacement operations. |
| Exact edits | Use existing inspector fields, including room dimensions, obstacle sizes, wall/offset, placement position and supported rotation. No mesh scaling. |
| Rotate | Use existing inspector controls and allowed quarter-turn commands; retain wall-mount restrictions. No arbitrary-angle rotation. |
| Remove / unplace | Keep separate labelled actions: unplace retains the shopping-list item and budget; remove deletes it through the existing command. Room-element deletion also uses existing forms. |
| Camera | Explicit Edit / Navigate controls. Edit owns primary click/drag; Navigate owns orbit gestures and cannot mutate the project. Zoom is available when no edit gesture is active. |
| Switch view | Keep project, selection, history and validation; cancel incomplete gestures/placement mode and clear drafts/errors. No revision change. |

The Edit/Navigate toggle is the baseline for mouse, trackpad and touch, not a hidden keyboard
modifier. Choosing a palette tool returns to Edit. In Navigate, primary drag/one-finger movement
orbits and two-finger gestures can zoom/pan. In Edit, only one pointer owns a gesture; an additional
touch cancels the draft and never commits it. Changing modes cancels any incomplete gesture.
Do not add optional shortcut gestures until this baseline is verified.

Provide Reset view and a top-down camera preset within 3D. Fit the initial camera to room bounds;
do not reset it on every project revision. Keep the camera above the floor and preserve navigation
across ordinary agent edits. No auto-orbit or decorative camera animation is required.

## Architecture decisions

### D1 — one mutation path; small rendering adapters

Keep `ProjectStoreProvider`, persistence and `CreatorWebMcpBridge` above both views. Extend the
editor view contract with selection/placement callbacks and a shared command-dispatch adapter;
do not create a scene-specific project store or WebMCP path. Extract pure shared builders from
`room-plan.tsx` while preserving SVG behaviour. Do not force Three.js rays into SVG transforms.

Suggested responsibility split (names may change, boundaries should not):

- `plan/create-room-element-command.ts`: room-element defaults and pure command builders.
- `scene/scene-targeting.ts`: scene-to-domain floor/wall targets and drag-plane projection.
- `scene/scene-edit-session.ts`: pure gesture lifecycle, pointer ownership, revision and draft.
- `scene/use-scene-editing.ts`: integration with callbacks, current project and dispatch.
- `scene/scene-editor.tsx`: editable scene shell and controls, replacing the read-only shell.
- `scene/scene-picking.tsx`, `scene/scene-camera-controls.tsx`, `scene/scene-boundary.tsx`:
  picking surfaces, navigation and scene recovery, split as needed to stay below 500 lines.

### D2 — domain geometry determines interaction

Use a ray/floor-plane intersection, then convert metres and room-centred coordinates to domain
centimetres. Place through the shared builders so centring, footprint rotation, wall snapping and
fit checks are identical to 2D. Preserve the initial pointer-to-object offset during dragging.
Keep current snap rules (10 cm for ordinary floor movement; existing mounting/edge exceptions).

Use stable hit targets derived from catalog/domain geometry, independent of GLB topology/loading.
Selection must behave the same for a loaded model, its fallback and an unavailable asset. Outlines,
use zones, lights, ghosts and visual walls must not intercept normal entity/floor editing.
An unavailable zone is itself an editable entity, unlike a derived equipment use-zone overlay.
Expose clear floor-edge/wall targets in door/window placement mode, including near-side walls.

**Camera-relative wall cutaway is required, not optional transparency polish.** The user's
30 August reference screenshot of 3D Gym Planner shows an open-front room with two rear walls.
Use that as visual inspiration, not evidence of the reference application's implementation.
For our editor, hide the full-height wall surfaces between the camera and the room interior,
typically two at an oblique corner view. Recompute the visible set when the camera orbits; do not
hard-code bottom/right walls as permanently absent. At a straight-on view the number may differ;
in the top-down preset show the floor boundary without full-height walls obscuring it.

Keep a thin floor-level perimeter/edge for orientation. Separate cutaway rendering from entity
selection and wall targeting: retain selectable door/window markers and mounted equipment even
when their wall surface is hidden. While placing a door/window, highlight the hovered wall's
edge/target with a ghost at the intended position; invisible full-wall meshes must not swallow
ordinary equipment or floor clicks. Keep targets available on all four walls. Use a stable
camera-side threshold/hysteresis so walls do not flicker near a visibility transition.

Cutaway changes presentation only: never remove a wall, opening or mounting relationship from
the project, and never change validation, access analysis, revision, history or exported data.

For mounted dragging, project the draft onto the current wall axis before calling the existing
mounting constraint helper. For doors/windows, snap and clamp offset to wall length minus width.
Do not invent door swing, window height or equipment elevation from their rendered appearance.

### D3 — drafts never enter project history

Keep pointer moves and placement ghosts in transient UI state. Draw the candidate footprint/use
zone from the prospective command, not from a second project store. The main validation panel
continues to describe the committed project; label drafts as previews rather than claiming validity.
There is no requirement to run full access analysis on every pointer move.

Dispatch only a completed changed edit. Click-only selection, cancelled gestures, no-op movement,
failed commands and camera controls must not create history entries or autosaves. Check command
results and display failures. Preserve existing policy: a successful edit can leave validation
errors/warnings; do not silently introduce collision rejection or a layout solver in the renderer.

### D4 — external edits invalidate an active gesture

Capture project revision at gesture start. Any revision change from WebMCP, inspector, undo/redo,
import, reset or room resize cancels the draft, releases capture and restores controls. Recheck
revision and entity/item existence synchronously against the current store immediately before
dispatch. A stale pointer-up must not overwrite a newer state. Read-only tool calls do not cancel.
Do not lock out the agent or queue its commands behind manual gestures.

### D5 — input cancellation and camera arbitration are explicit

Distinguish a click from a drag before creating an item; do not place on pointer-down. Track the
active pointer and a small movement threshold. Handle Escape, Cancel, pointercancel, lost capture,
window blur, unmount, view/mode change and revision invalidation. A release outside the canvas
cancels the edit; release inside can commit once. Restore controls on every exit path.

React Three Fiber propagation and capture differ from DOM propagation. Test overlapping picks,
floor hits beneath entities and capture cleanup; `stopPropagation` alone is not the camera policy.
Keep all scene listeners scoped and cleaned up under Strict Mode.

### D6 — 3D must not make the editor less recoverable or accessible

Preserve per-asset fallbacks. Add a scene-level error/loading boundary and WebGL/context-loss
handling outside the Canvas, with a visible route to the same project in 2D. Switching to fallback
must not remount the store, reset the project or unregister the bridge. Do not automatically retry
a failed scene in a render loop. The toolbar and inspector stay usable during model loading.

Keep native DOM buttons, element lists and inspector forms as the keyboard/screen-reader path.
Provide keyboard placement equivalent to existing 2D behaviour (Enter uses room centre or top-wall
centre, followed by precise inspector edits), Escape cancellation and visible focus. Announce
completed changes/cancellation/errors through a concise status surface, never every pointer move.
Do not expose an editable canvas solely as a read-only image or rely on colour alone for errors.
Keep shortcuts out of inputs, textareas, selects and editable content.

Make `.creator-scene-shell` participate in the same responsive ordering as `.creator-plan-shell`;
check toolbar, palette, scene and inspector at narrow widths and browser zoom. Scope touch handling
to the scene so page scrolling and inspector interactions remain usable.

## Sequenced implementation and checkpoints

1. **Shared foundations.** Extract room-element builders/defaults, define the scene view callbacks,
   implement inverse coordinates, floor/wall targeting and pure gesture state. Keep 2D the default.
   Checkpoint: focused geometry/command/session tests and existing SVG tests pass; no behaviour drift.

2. **Selection and safe navigation.** Introduce the editable shell, deterministic hit targets,
   inspector wiring, Edit/Navigate controls, room-fit/reset/top camera, camera-relative wall cutaway
   and independent wall targeting.
   Add scene-level recovery before relying on 3D. Checkpoint: a browser can select every entity kind,
   edit/delete using its inspector, navigate without edits and recover the same project in 2D.

3. **Creation.** Wire four palette tools, new equipment, existing unplaced items and catalog drop to
   shared builders. Add command-aligned ghost previews, errors, cancellation and keyboard placement.
   Checkpoint: each successful action creates one entity/item as appropriate and one undo step;
   invalid targets, selection-only products and cancellation create none.

4. **Movement and shared editing.** Implement floor and along-wall dragging, locking where the
   schema supports it, grab offsets, snapping, one-commit history and revision invalidation. Wire
   existing rotation/unplace/remove controls throughout. Checkpoint: test real pointer/camera
   arbitration and manual edit → agent read/change → validation → correction → shared undo in 3D.

5. **Make 3D primary.** After interaction checks pass, change the initial view to 3D and remove
   read-only preview copy. Preserve old 2D-focused tests by explicitly selecting 2D; add separate
   default-3D coverage rather than replacing those assertions. Check persistence, responsive layout,
   keyboard/touch controls, loading, asset failure and scene failure.

6. **Align documentation and final verification.** Update `docs/PRODUCT_CONCEPT.md`,
   `docs/EDITOR_MOCKUP.md` and the scene section of `docs/TECHNICAL_ARCHITECTURE.md` to the implemented
   contract. Keep planned versus observed capability explicit until this checkpoint. Record browser
   evidence and limitations in `docs/PHASE_27_3D_EDITOR_VERIFICATION.md`. Request a bounded reviewer
   pass over the shared-editing/input/history changes and resolve actionable findings.

Run `npm run quality:quick` after each coherent slice. Partial slices remain deployable with 2D
default; do not declare the phase complete or promote 3D merely because a screenshot looks ready.

## Tests

Use the existing Vitest/Testing Library setup. No new test dependency is assumed.

- Pure builder/targeting tests: all entity kinds, unknown IDs, selection-only rejection, placing an
  existing item without duplication, all walls/rotations, non-square room, inverse coordinate
  round trips, min-corner versus centre, snap/edge behaviour, oversized/no-hit/parallel-ray targets.
- Session tests: click/drag threshold, grab offset, many moves/one commit, wrong pointer, no-op,
  lock, Escape, blur, lost capture, release outside, second touch, switch mode/view and unmount.
- Concurrency tests: agent move/remove, unrelated mutation, room resize, undo/redo, import/reset
  during drag and placement preview; stale release commits nothing; read-only tools preserve draft.
- Component/controller tests: correct inspector and ID selection, ghost matches command,
  overlays cannot steal selection, camera mode cannot mutate, errors surface, capture/control
  cleanup and Strict Mode. GLB success/failure uses the same picking contract.
- Pure wall-visibility tests: camera on each side/corner, straight-on and top-down presets,
  stable transition thresholds and unchanged project data. Picking tests keep openings/mounted
  equipment and all four wall targets usable independently of visual wall visibility.
- Scene boundary tests: loading and whole-scene failure keep toolbar/store/history/bridge alive;
  switch to 2D works; a failed GLB does not fail the entire scene.
- Extend `creator-editor.test.tsx`, relevant creator placement tests and persistence integration
  tests for the new default/view switching. Existing dynamic mocks must exercise the view contract,
  not falsely claim to test WebGL raycasting.
- Extend `src/features/webmcp/creator-room-flow.integration.test.tsx` with a 3D-controller flow:
  manual edit → tool read observes it → tool change updates scene/inspector/validation → correction
  → shared undo/redo. Preserve existing SVG and batch-history cases and tool registration counts.

Run narrow checks first with `npm test -- <changed-test-paths>`. After coherent slices run
`npm run quality:quick`; during cleanup run `npm run lint:report`. Final gates are
`npm run agent:verify` and `npm run build` because the dynamic client/default-view boundary changes.
No non-test source/configuration file may exceed 500 physical lines.

## Browser verification and acceptance criteria

Use a fresh/restored project or test setup built with existing commands; Phase 26 is not required.
Real browser checks are mandatory: jsdom/controller tests cannot establish correct raycasting,
wall occlusion, WebGL recovery or camera/edit gesture ownership.

- Fresh creator opens in editable 3D; restored projects, including empty ones, behave the same.
- Without switching to 2D: configure the room, add a door/window, obstacle and unavailable zone,
  place free-standing and wall-mounted equipment, add a selection-only accessory to the list,
  edit, drag, rotate where supported, unplace/re-place and remove. Undo/redo restores each change.
- All four walls work from multiple camera angles; near-side walls do not hide essential targets.
  Occluded entities remain selectable through the list; tiny objects have usable hit targets.
- Orbit around all four corners: near-side wall surfaces disappear and rear surfaces remain as
  spatial context, without flickering. Top view keeps a readable floor boundary. Select/edit a
  door/window and mounted equipment on a hidden wall, then place an opening on that same wall.
  Camera/cutaway changes never alter room geometry, validation, revision, history or export.
- Mouse/trackpad and touch checks confirm Navigate never edits and Edit never simultaneously
  orbits. Cancel/release outside/second touch/focus loss do not leave a stuck drag or camera.
- One completed changed gesture is one history step; cancellation and camera motion leave revision,
  project, validation and persistence unchanged. Changing view preserves selection when it exists.
- A real WebMCP session completes the shared-editing loop in 3D. Tools observe manual commits;
  agent changes appear immediately and invalidate stale manual drafts safely.
- Deterministic validation remains visible after edits. Distinguish command failure, invalid layout
  and warnings; remaining warnings are not a renderer bug or automatic rejection.
- Loaded/missing/broken GLBs remain selectable and editable. Whole-scene failure/context loss
  permits recovery to 2D with unchanged project/history and functioning WebMCP registration.
- Keyboard/list/inspector editing works without pointer-only requirements; status is not noisy.
  Narrow layout, browser zoom and touch do not hide controls or trap page scrolling.
- Record browser versions, device/input method, project setup, build/commit and observations.
  Verify the public deployed build before final acceptance; deployment follows the normal approval
  workflow. Phase 16's separate paused asset review is not implicitly resumed by this phase.

## Exit gate

All acceptance criteria hold, narrow tests and canonical gates pass, reviewer findings are resolved,
and the real browser flow is recorded. 3D is then the default full editor; 2D remains operational.
No schema/tool/persistence fork has been introduced. Remove this plan and its queue row only after
that gate; keep the updated product/architecture docs and verification evidence.

## Implementation references

- Read the installed Next.js lazy-loading guide before changing dynamic client boundaries:
  `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`.
- [React Three Fiber event documentation source](https://github.com/pmndrs/react-three-fiber/blob/master/docs/API/events.mdx)
  — propagation, hit ordering and pointer capture differ from DOM events; consulted 30 August 2026.
- [Three.js OrbitControls](https://threejs.org/docs/pages/OrbitControls.html)
  — explicit camera/input configuration; consulted 30 August 2026. Check installed APIs when coding.
- `modern-web-guidance` accessibility guide — native controls, keyboard alternatives, focus,
  restrained announcements and non-colour error feedback informed this plan.
- User-provided screenshot of 3D Gym Planner, 30 August 2026: visual reference for open-front
  wall cutaway only. No third-party screenshot, code or assets are required to ship this feature.
