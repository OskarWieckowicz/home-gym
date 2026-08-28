# Phase 7 — Manual room editor

Umbrella: [implementation plan index](./README.md).

Status: ready to execute.

Depends on: Phase 6's runtime-validated project schemas, deterministic geometry and validation,
single command executor, and bounded vanilla Zustand store all passing `npm run agent:verify`.

Primary output: a responsive `/creator` room editor in which a person configures a rectangular
room, adds and edits obstacles or unavailable zones on a precise 2D plan, sees deterministic
validation feedback, and uses the same `dispatch(command)`, undo, and redo path reserved for future
WebMCP callers.

## Goal

Replace the `/creator` placeholder with the first usable manual editing surface. The editor binds
React to the Phase 6 vanilla store without adding another mutation path. It supports room and
project settings, obstacle creation and selection, form-based movement and sizing, 90-degree
rotation, locking, removal, validation display, and shared undo/redo.

The 2D plan is the authoritative editing view for this phase. It must make centimeters, rotated
footprints, room bounds, edge contact, collisions, and unavailable zones legible without
reimplementing geometry in components. Phase 8 adds WebMCP room tools. Phase 10 adds products,
clearance, totals, persistence, and import/export.

## Fixed product and architecture decisions

1. Create exactly one project-store instance per mounted creator workspace and provide it through a
   small React context/hook adapter. Components select state and call public store capabilities;
   they never mutate project objects or call a hidden reducer.
2. Every persisted domain edit goes through `store.getState().dispatch(command)`. Local UI state is
   limited to selection, open panels, drafts, pointer state, and view preferences.
3. Use the Phase 6 centimeter model directly. Convert centimeters to plan pixels only in a pure
   viewport transform; never round or write pixel-derived scene units back into the project.
4. Keep the 2D plan rectangular and axis-aligned. Rotation remains `0 | 90 | 180 | 270`, and an
   entity position remains the minimum corner of the rotated footprint.
5. Prefer accessible form controls for exact editing. Pointer dragging is an additional input path
   that emits the same `OBSTACLE_UPDATED` command on commit; it is not a separate state model.
6. Spatially invalid edits remain applied. The plan and properties panel show returned/store
   validation issues so the user can correct them. Form-schema errors prevent dispatch and stay
   distinct from layout issues.
7. Locked obstacles cannot be dragged, rotated, resized, renamed, reclassified, or removed. The UI
   exposes an explicit unlock action, matching the domain's separate undoable command.
8. Use semantic HTML for the shell, controls, forms, issue lists, and buttons. The plan renderer may
   use SVG because it provides a lightweight, inspectable 2D coordinate surface; validation remains
   in the pure domain and not in SVG hit-testing.
9. No 3D scene, product placement, saving, persistence, WebMCP registration, activity feed, or
   photo interpretation belongs in this phase. A disabled or explanatory affordance is preferable
   to pretending those capabilities exist.
10. Preserve `/creator` as a client boundary only where interactive state requires it. Read the
    installed Next.js guides under `node_modules/next/dist/docs/` before changing the route or
    Server/Client Component boundary, and run the production build because this phase changes both.

## Expected file map

The exact component split may adjust during implementation, but keep the store adapter thin and
the coordinate math outside React components:

```text
src/
├── app/
│   └── creator/
│       └── page.tsx
└── features/
    └── creator/
        ├── components/
        │   ├── creator-editor.tsx
        │   ├── creator-toolbar.tsx
        │   ├── element-panel.tsx
        │   ├── project-settings-form.tsx
        │   ├── room-form.tsx
        │   ├── obstacle-form.tsx
        │   ├── room-plan.tsx
        │   └── validation-summary.tsx
        ├── plan/
        │   ├── plan-transform.ts
        │   └── drag-session.ts
        ├── store/
        │   ├── project-store.ts
        │   └── project-store-context.tsx
        └── editor-types.ts
```

Use colocated focused tests. Split components before any non-test file approaches 500 physical
lines, and avoid an editor component that owns toolbar, forms, SVG drawing, and pointer behavior.

## Implementation sequence

### 1. Verify the platform boundary and define the editor state contract

- Run `modern-web-guidance` for the form, responsive workspace, pointer interaction, and accessible
  SVG use cases before writing client UI.
- Read the relevant installed Next.js App Router and Client Component guides.
- Define the public React store provider/hook and local editor state: selected entity ID, active
  panel, obstacle-add defaults, and optional drag draft.
- Decide the responsive breakpoints from the existing global styles and editor mockup rather than
  importing a second design system.
- Keep the creator route server-renderable around one explicit client editor boundary.

Acceptance:

- A dependency test proves the Phase 6 geometry/project layers still do not import React, Zustand,
  creator UI, Next.js, catalog, or WebMCP modules.
- Mounting two providers creates independent projects and histories.
- React components cannot access `setState` or private history arrays through the public adapter.
- `/creator` renders without hydration warnings or module-level shared mutable project state.

### 2. Build pure 2D viewport transforms

- Fit a room of arbitrary valid dimensions into the available plan viewport while preserving
  aspect ratio, readable padding, and the `x`/`z` minimum-corner coordinate system.
- Convert domain rectangles into SVG coordinates and convert pointer deltas back into integer
  centimeters with an explicit snap increment.
- Reuse `createRectangleFootprint` for rotated dimensions. Do not duplicate rotation or collision
  logic in the renderer.
- Keep zoom/resize math deterministic and independent of the DOM where practical.

Acceptance:

- Tests cover wide, deep, square, and small rooms; all four rotations; round trips; resize; plan
  padding; and snap behavior near half-step boundaries.
- Room-edge coordinates map exactly to the visual room boundary.
- Changing viewport size changes only presentation coordinates, never project state.
- Drag calculations cannot produce fractional or negative domain positions.

### 3. Add the creator shell and project controls

- Replace the placeholder with the toolbar, element panel, central plan, and properties/validation
  panel described by the mockup, adapted for desktop and narrow screens.
- Add room width/depth/height, budget, and training-goal forms using the public Phase 6 schemas or
  command schemas for boundary validation.
- Add undo/redo buttons driven by `canUndo`/`canRedo`; expose revision changes in testable state, not
  as user-facing debug copy.
- Mark save and 3D controls absent or clearly unavailable instead of adding incomplete behavior.

Acceptance:

- Exact valid values dispatch `ROOM_CONFIGURED` or `PROJECT_SETTINGS_UPDATED` once per committed
  action.
- Blank, fractional, negative, zero where prohibited, and unknown goal values do not dispatch.
- Undo/redo button availability follows the store after edits, no-ops, failures, branching, undo,
  and redo.
- Keyboard focus, labels, field errors, and button names remain usable without the plan canvas.

### 4. Render selectable room entities and validation state

- Draw the room boundary, a centimeter-aware grid, physical obstacles, and unavailable zones with
  distinct visual treatments.
- Render each entity from its rotated domain footprint, keyed by stable obstacle ID.
- Support pointer and keyboard selection and show selected state independently from the project
  schema.
- Map validation issue codes/details to concise presentation copy and visual highlighting without
  storing messages in the domain.

Acceptance:

- Edge-touching entities are not shown as colliding; positive-area overlaps are.
- `OUTSIDE_ROOM`, `PHYSICAL_COLLISION`, and `UNAVAILABLE_ZONE_CONFLICT` have distinct, accessible
  text and non-color-only visual indicators.
- Reordering project obstacles does not change issue wording, selection identity, or rendering
  geometry.
- Empty, valid, multi-issue, and overflow layouts render without exceptions.

### 5. Add obstacle and unavailable-zone editing

- Add an element-panel action and form to create either kind with name, position, dimensions,
  rotation, and locked state; IDs remain executor-generated.
- Add a properties form for exact updates and explicit rotate, lock/unlock, and remove actions.
- Normalize trimmed names and schema-valid integer values at the command boundary.
- Keep selection coherent after update, removal, undo, and redo. If a selected entity no longer
  exists, clear selection without modifying project history.

Acceptance:

- Add, edit, rotate, classify, lock/unlock, and remove all dispatch the corresponding public Phase
  6 commands and display their structured outcome.
- Locked controls are disabled with an explanation; unlock dispatches only `{ locked: false }`.
- Removing a selected obstacle clears selection, and undo restores the entity without inventing a
  new ID.
- Invalid geometry is visible and correctable; invalid command input remains rejected.

### 6. Add pointer dragging as a command adapter

- Start a local drag session from the selected unlocked entity, using pointer capture and the pure
  viewport transform.
- Render an ephemeral preview during movement, then dispatch one `OBSTACLE_UPDATED` command on
  pointer-up. Cancelled drags and zero-distance drags do not create history.
- Clamp preview coordinates to non-negative integers but do not clamp maximum room bounds; users
  must be able to see and correct an outside-room result.
- Support a keyboard alternative through exact position inputs and incremental movement controls.

Acceptance:

- One completed drag creates exactly one revision and undo step, regardless of pointer-move count.
- Cancel, lost capture, locked entity, and no-op drag create no project change.
- Dragging outside the far room edge succeeds with `OUTSIDE_ROOM`; dragging below the minimum
  corner never emits negative coordinates.
- Drag behavior remains correct after rotation, viewport resize, undo/redo, and selection change.

### 7. Prove the manual shared-command scenario

- Add a React integration test for configure room → update settings → add locked wardrobe → add
  unavailable door zone → create conflict → inspect feedback → correct → undo → redo.
- Spy at the public store boundary to verify forms, buttons, and drag commits all call `dispatch`
  rather than mutating project state.
- Confirm the final state matches the equivalent Phase 6 store-only scenario.
- Verify the creator route and existing catalog/landing tests remain unchanged in behavior.

Acceptance:

- The scenario is operable through accessible names and does not reach into component internals.
- The locked wardrobe cannot move or be removed until an explicit unlock action.
- The issue summary contains enough entity context for a person to identify the conflict.
- Undo and redo restore both visual geometry and form values from the same store snapshots.

### 8. Verify and hand off the editor

Run the narrowest checks while implementing, then the phase gate:

```bash
npm test -- src/features/creator
npm test -- src/app/creator
npm run quality:quick
npm run lint:report
npm run agent:verify
npm run build
```

Manual/code-review checks:

- exercise the desktop and narrow responsive layouts with keyboard and pointer input,
- inspect invalid, locked, empty, and multi-issue states,
- confirm all project mutations enter through `dispatch(command)`,
- confirm `/creator` still loads on direct navigation and production build output,
- confirm no Phase 8 WebMCP or Phase 10 placement/persistence behavior leaked into the editor.

## Test inventory

### Store binding and forms

- independent provider instances and subscription cleanup,
- room and project-settings valid/invalid submissions,
- obstacle add/update/remove and name trimming,
- exact unlock-only behavior,
- undo/redo availability and selection cleanup.

### Plan geometry and interaction

- room-to-viewport scale and centering,
- centimeter/pixel conversion and snapping,
- four rotations and rotated drag previews,
- pointer commit/cancel/no-op/lost-capture behavior,
- keyboard editing alternative and focus behavior.

### Rendering and feedback

- physical obstacle versus unavailable-zone presentation,
- selection and locked state,
- all Phase 6 issue codes and structured detail mapping,
- valid, empty, overflow, collision, and multiple-issue projects,
- responsive panel ordering and accessible labels.

### Existing regressions to preserve

- all Phase 6 schema, geometry, validation, command, history, and boundary tests,
- catalog schemas, queries, data, pages, and WebMCP tests,
- landing/shared UI tests,
- lint, TypeScript, duplicate detection, file-size guard, and production build.

## Scope boundary

Out of scope for Phase 7:

- WebMCP registration or handlers for project reads/mutations,
- equipment placement, catalog drag/drop, clearance zones, budget totals, or suggestions,
- 3D rendering, React Three Fiber, orbit controls, or realistic models,
- project naming, save buttons with effects, localStorage, autosave, import/export, migrations, or
  share URLs,
- photo analysis, doors/windows as wall geometry, polygons, arbitrary rotation, snapping guides,
  multi-select, batch edits, or a global solver,
- activity-feed metadata or caller-origin distinctions in domain commands.

## Exit gate

Phase 7 is complete when:

1. `/creator` is a responsive, accessible manual editor rather than a placeholder.
2. Room/settings and obstacle/unavailable-zone edits flow exclusively through the Phase 6
   `dispatch(command)` contract.
3. The 2D plan uses pure transforms and Phase 6 footprints, with no duplicated validation engine.
4. Selection, exact forms, rotation, lock/unlock, removal, and pointer dragging work with one shared
   project state and history.
5. All deterministic validation issues are visible and correctable without rejecting invalid
   intermediate layouts.
6. Undo/redo covers manual form and drag changes, no-ops create no history, and branching remains
   correct.
7. Focused React/domain tests, `quality:quick`, `agent:verify`, and the production build pass.
8. Existing catalog, WebMCP, and landing behavior remains unchanged.

After the gate passes, remove Phase 7 from the active implementation index, delete this file, and
promote Phase 8 to a detailed plan. Git history remains the implementation record.

## Risks and controls

| Risk | Control |
|---|---|
| Components create a second mutation path | Provide only the public store API and assert dispatch calls in integration tests. |
| SVG/pixel math diverges from domain coordinates | Centralize pure transforms and reuse rotated footprint helpers. |
| Pointer moves flood undo history | Keep drag preview local and dispatch once on commit. |
| Invalid layouts get blocked by forms | Separate command-schema validity from returned layout issues. |
| Locked objects appear editable | Disable all edit paths and expose a separate unlock command. |
| Selection leaks into persisted state | Keep it local to the editor adapter and reconcile it after history changes. |
| Responsive panels make controls inaccessible | Preserve semantic source order and test keyboard/narrow layouts. |
| Phase 7 expands into 3D, products, or persistence | Hold the explicit scope boundary and use truthful unavailable affordances only if needed. |
