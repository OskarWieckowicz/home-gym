# Phase 27 — primary 3D editor verification

Date: 30 August 2026. Base commit: `15bb7a8`, plus the uncommitted Phase 27 implementation.

## Status

**Completed — closed at the user's request on 30 August 2026.** 3D is the default editor;
2D remains a precise alternative and recovery path. The phase and its contextual-gesture follow-up
have been removed from the active queue; their plans remain available in Git history.
Outstanding public/device checks below remain release-verification items for Phase 24, not claimed
passes. No deployment was made as part of this closure.

No project schema, storage key, validation rule, equipment lock field or WebMCP tool was added.
Pre-existing working-tree changes to plans and WebMCP descriptions were preserved.

## Automated coverage

- Shared room-element builders retain existing SVG semantics; inverse coordinates, non-square
  rooms, all four walls, rotations, mounting projection, no-hit/parallel rays and edge snapping.
- Pure sessions and the real scene controller: click threshold, grab offset, one commit for many
  moves, no-op, locking, incorrect pointer, capture loss, outside release, additional pointer,
  mode change, disposal and revision invalidation. Nullable floor rays still permit selection,
  but never authorize creation/movement; invalid hover clears the previous ghost.
- Actual store and WebMCP handlers: manual commit → tool read → tool update → validation →
  correction → shared undo/redo. Agent removal, unrelated edits, room resize, replace/import/reset
  and history changes invalidate drafts; read-only calls preserve them.
- DOM integration under Strict Mode: real hook/controller/store with renderer/picking probes,
  scoped listener cleanup, outside second-pointer cancellation, focus without scrolling, native
  centre placement, keyboard cancellation, input exclusions, errors/status, catalog drop,
  camera mode, whole-scene failure/context-loss recovery and pointer release.
- Domain-envelope picking is independent of assets, overlays and wall cutaway; openings and
  mounted elevation have dedicated cases. Prospective-command ghosts cover all catalog products.
- Existing SVG integration assertions remain and now explicitly choose 2D. Separate default-3D,
  shared-store/view-cancellation and restored-project assertions were added.

`quality:quick` passed after coherent slices. `lint:report` was inspected: advisory complexity
warnings remain in the existing editor/domain code and the gesture controller; no blocking errors.
The ghost builder was split into small typed helpers during cleanup.

Initial implementation gates: `npm run agent:verify` passed **102 test files / 879 tests**, blocking ESLint,
TypeScript, duplicate detection (0.66% duplicated lines) and the 500-line guard.
`npm run build` passed with all 43 pages generated. `git diff --check` passed.

## Real browser observations

Surface: Codex in-app Chromium browser on macOS; exact embedded browser version is not exposed by
the documented browser-control surface. Input: automated real mouse clicks/drags and keyboard;
not a physical touch device. Default desktop viewport approximately 1265 × 712; responsive
override 390 × 844 (375 px content width after scrollbar). Temporary viewport override restored.

Builds: Next.js 16.3.3 dev at `localhost:3000`; optimized `npm run build` / `npm run start -- --port
3002` for isolated mutations. The user's saved localhost:3000 room was opened in 3D read-only;
mutation tests used a separate empty project at localhost:3002, avoiding that saved room.

Observed on the local optimized build:

1. Empty 400 × 320 × 240 cm room loaded. Switched to 3D for the pre-promotion test build.
2. Created a physical obstacle using Place at centre. Inspector showed `(150, 140)` cm. A real
   mouse drag changed it to `(310, 120)` in one revision and displayed the expected outside-room
   validation error; no automatic collision rejection was introduced.
3. Real browser WebMCP `get_project_state` observed that manual commit at revision 2.
   `update_obstacle` corrected it to `(50, 50)` at revision 3. Inspector and validation updated;
   toolbar Undo restored X=310 and Redo restored X=50, while 3D stayed active.
4. Added a door by clicking the bottom wall edge, a top window using centre placement, and
   windows by clicking left/right edges. Near-side door selection worked independently of its
   hidden wall. Dragging that door changed its offset from 160 to 230 cm, retaining bottom wall.
5. Added an unavailable zone by clicking the floor; placed Northstar Half Rack, rotated it,
   unplaced and re-placed the existing item. WebMCP confirmed one item and one placement, not a
   duplicate. Added Cove Wrist Wraps as a selection-only shopping-list item.
6. Placed Anchor Pull-Up Bar with genuine catalog wall mounting. Its inspector showed top wall,
   bottom height 195 cm and Z=0. A real top-view drag changed X=144 to X=224 while retaining Z=0.
   Foundry Folding Wall Rack has ordinary floor mounting in the current catalog despite its name;
   its free-floor behavior was not treated as a mounting regression.
7. Navigated around the room with repeated mouse orbits. Near-side walls disappeared and rear
   surfaces remained; openings and equipment stayed visible. Revision remained 12 throughout
   this navigation check. Top view removed full-height walls and retained the floor perimeter.
8. Started a placement ghost, then changed budget through real WebMCP. The ghost/Cancel placement
   UI disappeared immediately without committing the draft.
9. At narrow width, controls wrapped, scene appeared in the same ordering as 2D, inspector/list
   content remained reachable by page scrolling, and document scroll width equalled content
   width (375 px), without horizontal overflow.
10. After the final build, the restored localhost:3002 project and a fresh empty project at
    127.0.0.1:3002 both opened with 3D active by default. Keyboard Enter placed a physical obstacle
    in the fresh project, announced the saved change and left the browser error log empty.
11. A real drag released outside the canvas left that obstacle at its original `(150, 140)` cm
    position, without committing the draft.

Browser checks identified and fixed focus-induced page movement on pointer-down (`preventScroll`)
and active-button hover contrast. The bounded reviewer found a stale pointer ID after lost capture;
that was fixed and regression-tested. Follow-up review found no actionable issues.

## Contextual-gesture follow-up — 30 August 2026

The user replaced the original explicit Edit/Navigate contract. There is now one mode: short
click selects/clears, drag on the already-selected entity edits, and drag elsewhere (including
an unselected entity) orbits. Ownership is fixed at pointer-down. Placement remains temporary;
native inspector/list/centre controls preserve the alternative to dragging.

Automated coverage now includes selection-before-move, unselected/background drags, retained
selection, crossing hit targets, nullable floor rays, second-pointer cancellation, and actual DOM
propagation to a mocked native camera listener. Prior command/history/revision tests remain.
Bounded review of the controller, DOM capture, hook and installed OrbitControls found no
actionable regression. `quality:quick`, `agent:verify` (**102 files / 890 tests**), `build`
(43 pages) and `git diff --check` passed. `lint:report` has no errors; advisory warnings remain.

Observed in the optimized local build at `127.0.0.1:3002/creator`, same macOS in-app browser and
desktop mouse automation as above, using the previous synthetic 400 × 320 cm one-obstacle room:

- Restored project opened in 3D without Edit/Navigate buttons.
- Dragging the unselected obstacle visibly orbited the room; selection stayed empty and Undo
  remained disabled.
- Clicking that obstacle opened its inspector at `(150, 140)` cm. The next drag moved it to
  `(180, 260)` cm while the camera and wall orientation stayed fixed.
- Dragging the background orbited while retaining the selected obstacle and its exact position.
- One Undo restored `(150, 140)` cm and exhausted undo history: camera actions added no edits.
- Clicking background cleared selection. Catalog placement and Cancel remained reachable.
- The browser error log was empty. The synthetic obstacle's original position was restored.

The pre-existing dev server at port 3000 stayed on the loading surface during this attempt;
it was not restarted or used as evidence. Verification used the successful optimized build.
No public deployment, physical touch or GPU-failure claim is added by this follow-up.

## Frontal cutaway correction — 30 August 2026

User screenshot showed a side wall disappearing too early near a frontal view. The old signed
0.08 side threshold hid it after roughly 4.6° and retained that hidden state until crossing the
opposite side of the axis. The corrected horizontal thresholds hide after 25° and restore below
20°, leaving only the front wall hidden near any of the four principal directions. The 20–25°
band preserves prior visibility to avoid flicker. Top-down logic and domain state are unchanged.
Regression tests cover both orbit directions around every axis, corner-to-front restoration,
both thresholds and camera-distance independence. Exact angles are code-tested, not measured
from a new browser capture.
Focused cutaway tests passed (19 cases); `quality:quick` and `agent:verify` passed (102 files /
898 tests). `lint:report` retained advisory warnings only, with no new cutaway warnings.

## Remaining acceptance checks / limitations

- Deploy the final build through the normal approval workflow, then repeat the public fresh-session
  WebMCP/manual loop. Current deployed site was not claimed to contain these changes.
- Physical touch/trackpad, two-finger navigation, browser zoom and screen-reader testing remain.
  DOM pointer tests and a narrow viewport do not establish those device behaviors.
- Deliberate real GPU context loss/unavailable WebGL/failed GLB injection remains. Automated tests
  cover the boundaries, listener cleanup and unchanged store/history; no real GPU failure was
  induced through the read-only browser evaluation API.
- Live drag interrupted mid-press by an agent, full file import/export/reset and destructive remove
  flows are covered by automated integration tests, not all repeated in the real browser.
- Catalog drop has DOM/controller payload coverage; a real OS drag-and-drop was not observed.
- The synthetic browser layout intentionally retained validation conflicts created during tests.
  Those errors demonstrate committed-layout validation, not a claim that the test gym is usable.

These limitations remain documented after user acceptance and closure; Phase 24 tracks their
pre-submission review. Closing the implementation phase does not establish device or public-build coverage.
