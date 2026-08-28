# Phase 6 — Room domain core

Umbrella: [implementation plan index](./README.md).

Status: ready to execute.

Depends on: Phase 5's hard gate: the deployed catalog tools were discovered and called from a
supported agent environment after a fresh load.

Primary output: a runtime-validated, deterministic project domain for rectangular rooms and
obstacles, exposed through one command dispatcher and one bounded undo/redo store, without a UI or
WebMCP dependency in the domain layers.

## Goal

Create the stable core that both the manual editor and mutable WebMCP tools will use. A caller can
configure a room, update project settings, add or change rectangular obstacles and unavailable
zones, remove them, inspect deterministic validation issues, and undo or redo every successful
change through the same `dispatch(command)` contract.

This phase proves state shape, coordinate semantics, command behavior, geometry, validation,
history, and the Zustand adapter in isolation. Phase 7 owns the manual editor, Phase 8 owns room
WebMCP tools, and Phase 10 owns equipment placement, equipment clearance, budget totals,
persistence, and import/export.

## Starting point and dependency evidence

- The repository has validated catalog schemas and pure query functions, but no project, geometry,
  creator-store, or persistence modules yet.
- `/creator` is still a placeholder, so the domain can be designed and tested without preserving an
  existing editor state shape.
- Zod 4 and Vitest are already installed. Zustand is accepted by the architecture but is not yet a
  dependency.
- Product dimensions, clearance, prices, and training goals already exist in the catalog. The
  training-goal vocabulary is shared product/project language, so Phase 6 moves its enum and schema
  to a neutral module imported by both features; project code must not import catalog modules, data,
  or queries.
- The Phase 5 gate is treated as satisfied because Phase 6 is first in the active queue. If that
  evidence is not actually available, stop before implementation and restore Phase 5 to the queue;
  do not build a mutable room path on an unverified WebMCP runtime assumption.

## Fixed domain decisions

1. Store every length as an integer number of centimeters. Positions are non-negative integer
   centimeters from the room's minimum `x`/`z` corner; rendering will later translate them to a
   centered scene.
2. Support only rectangular rooms and axis-aligned rectangular footprints. Rotations are exactly
   `0 | 90 | 180 | 270`; `90` and `270` swap width and depth.
3. An entity position identifies the minimum corner of its rotated footprint. Rotation does not
   silently recenter or move the entity.
4. Room bounds are inclusive. Two rectangles that only touch at an edge or corner do not collide;
   any positive-area overlap is a collision.
5. Represent furniture and unavailable areas with the same rectangular `Obstacle` model and
   `kind: "obstacle" | "unavailable-zone"`, so a wardrobe, radiator, or rectangular door-swing
   zone shares geometry without requiring polygons.
6. Infer TypeScript domain types from strict Zod schemas. Use Zod constructs with unambiguous JSON
   Schema equivalents because the same inputs will later back WebMCP tools.
7. Keep project format version separate from store revision/history. Start the persisted domain
   shape at format version `1`; do not increment it for ordinary edits.
8. Commands reject malformed input, missing entities, duplicate generated IDs, and forbidden edits
   to locked obstacles without changing project state or history. Spatially invalid but
   well-formed layouts are applied and returned with validation issues so the user or agent can
   inspect and correct them.
9. A locked obstacle may only be updated to unlock it. Its geometry, name, kind, or removal cannot
   change while locked. Unlocking and any later edit are separate undoable commands.
10. Command results are stable, discriminated, JSON-serializable envelopes. Success identifies the
    command, whether state changed, affected entity IDs, and current validation issues. Failure
    returns a bounded project-authored error code and message without exposing Zod internals or
    stack traces. The pure executor does not know about store revision; `dispatch` adds the revision
    to its store-facing result.
11. The pure command executor accepts an injected ID generator for add operations. Production uses
    a browser-safe UUID source; tests inject deterministic IDs. UI and WebMCP adapters never invent
    a second mutation path.
12. Validation output contains codes and structured data, not presentation copy. Issue and entity
    ordering must be deterministic so UI rendering, agent results, and tests agree.
13. Every successful state-changing dispatch creates one history entry. Rejected and no-op commands
    do not. A new edit after undo clears the redo branch. Keep at most 50 past project snapshots.
14. Undo and redo restore project snapshots, recompute validation, advance the store revision, and
    use the same store for future manual and agent operations. They do not bypass project schemas.
15. Implement the store with `zustand/vanilla` so it can be tested in Node without React or the DOM.
    Phase 7 may bind that vanilla store to React without changing domain behavior.

## Phase 6 project contract

The exact field split may be adjusted during implementation, but the behavior below is fixed.

### Project state

- `GymProject` contains `version`, `room`, `obstacles`, `budget`, and `trainingGoals`.
- Phase 10 adds placements and advances the format version before persistence or import/export is
  public, keeping Phase 6 free of a partially implemented equipment state.
- Room and obstacle dimensions are positive integers. Positions and budget are non-negative
  integers. Names are trimmed, non-empty, and bounded. IDs use project-authored patterns.
- Obstacles contain `id`, `kind`, `name`, `position`, `dimensions`, `rotation`, and `locked`.
- The default empty project is a valid, deeply independent value; callers cannot mutate shared
  fixture objects accidentally.

### Commands

Phase 6 implements:

- `ROOM_CONFIGURED` with a complete valid room,
- `PROJECT_SETTINGS_UPDATED` with a strict partial update for budget and training goals,
- `OBSTACLE_ADDED` with obstacle fields except the generated ID,
- `OBSTACLE_UPDATED` with an obstacle ID and a non-empty strict patch,
- `OBSTACLE_REMOVED` with an obstacle ID.

Batch layout changes, placement commands, persistence replacement/import, selection, demo reset,
and activity-feed metadata are deliberately absent.

### Validation

Phase 6 emits deterministic issues for:

- any obstacle or unavailable-zone footprint extending outside room width or depth, or its height
  exceeding room height,
- positive-area overlap between two physical obstacles,
- positive-area overlap between a physical obstacle and an unavailable zone.

Issues include a stable code, severity, sorted entity IDs, and structured details such as affected
axes or overlap bounds. The validator reports all issues in one pass and never mutates or repairs
the project. Product clearance, product height requirements, equipment collisions, shopping-list
cost, and budget excess are Phase 10 behavior even if their future codes are reserved now.

The Phase 6 codes are `OUTSIDE_ROOM`, `PHYSICAL_COLLISION`, and `UNAVAILABLE_ZONE_CONFLICT`, all
with `error` severity. `OUTSIDE_ROOM` details identify horizontal and/or height axes. Two
unavailable zones may overlap without producing an issue because their union remains unavailable;
each zone is still checked against the room. Command failures use `INVALID_COMMAND`,
`ENTITY_NOT_FOUND`, `ENTITY_LOCKED`, `ID_CONFLICT`, or `EXECUTION_FAILED`; later adapters may
translate those stable codes into audience-specific copy.

## Expected file map

Keep non-test source files under the 500-line hard limit and split by responsibility rather than
building one domain barrel with all behavior:

```text
src/
├── shared/
│   └── schemas/
│       └── training-goal.ts           vocabulary shared by catalog and project
└── features/
    ├── geometry/
    │   ├── rectangles.ts                  rotated footprints and overlap semantics
    │   └── room-bounds.ts                 horizontal and vertical containment
    ├── project/
    │   ├── commands/
    │   │   ├── apply-project-command.ts   pure command executor
    │   │   └── command-results.ts         stable success/error envelopes
    │   ├── schemas/
    │   │   ├── geometry.ts                centimeters, position, dimensions, rotation
    │   │   ├── project.ts                 room, obstacle, settings, project v1
    │   │   └── project-command.ts         strict discriminated command schemas
    │   ├── validation/
    │   │   ├── validation-issues.ts       codes and structured issue types
    │   │   └── validate-project.ts        deterministic room/obstacle validation
    │   └── defaults.ts                    fresh valid project factory
    └── creator/
        └── store/
            └── project-store.ts           vanilla Zustand adapter and bounded history
```

Use colocated focused tests for each geometry primitive, schema, command executor, validator, and
store behavior. Small index files may expose the public contract when they clarify imports; avoid
barrels that create catalog/project cycles.

## Implementation sequence

### 1. Lock the public domain contract and add the store dependency

- Add Zustand at the package-manager-resolved version compatible with the current React/TypeScript
  project; use its vanilla API in this phase.
- Define the intended public imports and keep `geometry` and `project` free of React, Zustand,
  Three.js, DOM, Next.js, localStorage, catalog queries, and WebMCP imports.
- Record the coordinate, rotation, edge-contact, invalid-layout, lock, and history semantics in
  source comments only where the code cannot make them self-evident.

Acceptance:

- `zustand` is a production dependency and the lockfile is updated through npm.
- A dependency-boundary test or targeted static check proves pure domain modules do not import UI,
  store, browser, or WebMCP modules.
- The public contract has one source for schemas and one command execution entry point.

### 2. Add strict geometry and project schemas

- Create reusable schemas for centimeters, positions, 3D dimensions, rotation, room, obstacle,
  project settings, and `GymProject` version 1.
- Move the existing training-goal enum/schema/type to the neutral shared module and update catalog
  imports without changing accepted catalog data or filter behavior.
- Define strict schemas for every Phase 6 command and infer command/input types from them.
- Add a fresh-project factory; never export one mutable singleton as application state.

Acceptance:

- Valid room/project/command examples parse and normalize exactly once at the boundary.
- Fractional, negative, zero where prohibited, unsupported rotation, blank/oversized names,
  unknown keys, duplicate obstacle IDs, and unsupported project versions fail predictably.
- Partial update schemas reject empty patches and fields that Phase 6 does not own.
- Generated command JSON Schemas are plain object/union schemas without transforms or ambiguous
  refinements that would block later WebMCP reuse.
- Two default projects do not share mutable arrays or nested objects.

### 3. Implement deterministic rectangle geometry

- Convert an entity's position, dimensions, and rotation into a normalized horizontal footprint.
- Check horizontal and vertical room containment without rounding or scene-unit conversion.
- Compute positive-area rectangle intersections and, where useful, their overlap bounds.
- Keep functions total for schema-valid input and independent of application state.

Acceptance:

- Tests cover all four rotations, non-square footprints, exact-boundary placement, every room edge,
  one-centimeter overflow, full containment, partial overlap, full overlap, identical rectangles,
  edge contact, corner contact, and symmetry.
- Rotation twice by 90 degrees yields the same footprint dimensions as 180 degrees; four quarter
  turns restore the original dimensions.
- Edge/corner contact is valid and positive-area overlap is always detected in both argument orders.

### 4. Build exhaustive, stably ordered project validation

- Validate each obstacle against horizontal room bounds and room height.
- Compare each unordered entity pair exactly once and apply the fixed matrix: obstacle–obstacle is
  `PHYSICAL_COLLISION`, obstacle–unavailable is `UNAVAILABLE_ZONE_CONFLICT`, and
  unavailable–unavailable produces no pair issue.
- Normalize pair entity IDs and sort final issues by a documented stable key.
- Return fresh, JSON-serializable issue data without altering the project.

Acceptance:

- One project can report bounds/height, physical collisions, and unavailable-zone conflicts in the
  same result.
- Collision pairs are neither duplicated nor direction-dependent.
- Reordering inputs without changing entity identity does not change the normalized issue set or
  order.
- Repeated validation returns deeply equal results and leaves a frozen input unchanged.
- Empty rooms and valid non-overlapping obstacles return an empty issue list.

### 5. Implement the pure command executor

- Parse `unknown` commands at runtime, check entity and lock preconditions, apply immutable changes,
  validate the resulting project, and return the stable result envelope.
- Generate obstacle IDs only through the injected dependency and return the created ID.
- Define no-op behavior explicitly: an update equal to current state succeeds with `changed: false`
  and does not create a history entry when dispatched by the store.
- Redact unexpected internal errors into one bounded failure result; programmer invariant failures
  may still throw in test/development code before they cross the public command boundary.

Acceptance:

- Every command has success, malformed-input, missing-entity, locked-entity, and relevant no-op
  coverage.
- Room shrinkage or obstacle movement that creates geometry issues succeeds and returns the full
  new validation result.
- Rejected commands preserve the original project by identity and value.
- Successful changes do not mutate the prior project or untouched entity objects unnecessarily.
- Generated-ID collisions fail safely without overwriting an obstacle.
- Every public result survives `JSON.stringify` and contains no raw exception or Zod issue object.

### 6. Add the vanilla Zustand project store and bounded history

- Create a store factory that accepts an initial project and optional deterministic command
  dependencies for tests.
- Keep current project, validation, monotonic store revision, past snapshots, future snapshots, and
  `dispatch`, `undo`, and `redo` capabilities in one store.
- Validate the initial project once, recompute validation after dispatch/undo/redo, cap `past` at 50,
  and expose explicit `canUndo`/`canRedo` state or selectors.
- Keep history arrays private to the store implementation and expose project/result contracts as
  readonly data; do not deep-freeze the entire Zustand state or publish snapshot references.

Acceptance:

- Manual and future agent callers can use the same `store.getState().dispatch(command)` entry point.
- A successful change creates one snapshot; a no-op or rejection creates none.
- Undo and redo restore exact project content, recompute issues, increment revision, and update
  availability flags.
- Dispatch after undo clears future history; more than 50 edits evict only the oldest snapshots.
- Failed dispatch, undo with no past, and redo with no future leave project and revision unchanged.
- Store tests run in the Node environment with no React render or DOM shim.

### 7. Prove the shared-editing domain scenario without UI

- Add an integration-style test that configures the demo-sized room, sets budget/goals, adds a
  locked wardrobe and an unavailable door zone, introduces and then fixes a collision, and walks
  backward/forward through the same store history.
- Call only public schemas, the store factory, and `dispatch`; do not reach into reducer internals.
- Verify the returned affected IDs and issues are sufficient for a future UI and WebMCP adapter to
  explain each result without recomputing command behavior.

Acceptance:

- One deterministic test demonstrates configure → add → invalid update → inspect issues → correct →
  undo → redo.
- The locked obstacle cannot be moved or removed until an explicit unlock command succeeds.
- The final project and validation are identical regardless of whether commands are described as
  manual or agent-originated; no caller-specific code path exists.

### 8. Verify and hand off the core

Run narrow checks during implementation, then the complete phase gate:

```bash
npm test -- src/features/geometry
npm test -- src/features/project
npm test -- src/features/creator/store
npm run quality:quick
npm run lint:report
npm run agent:verify
```

`npm run build` is not required solely for Phase 6 because it must not change routes,
Server/Client Component boundaries, Next.js configuration, or deployment behavior. Run it if the
actual implementation crosses any of those boundaries.

Manual/code-review checks:

- inspect imports under `src/features/geometry` and `src/features/project` for forbidden UI/store/
  browser dependencies,
- inspect the public command and issue shapes as JSON and confirm they are concise enough for later
  WebMCP results,
- confirm `/creator` remains a placeholder and catalog behavior is untouched,
- confirm the public deployed catalog from Phase 5 still opens after dependency installation.

## Test inventory

### Schemas and defaults

- valid project version 1 and every command variant,
- strict unknown-key rejection and integer/positive/non-negative bounds,
- rotation and obstacle-kind enums,
- duplicate entity IDs and unsupported versions,
- non-empty update patches,
- independent default-project values,
- selected generated JSON Schema invariants.

### Geometry and validation

- rotated footprint dimensions for four rotations,
- inclusive bounds and each overflow direction,
- vertical containment,
- overlap symmetry, positive-area intersection, edge/corner contact,
- exhaustive multi-issue reporting,
- unique normalized pairs and stable ordering,
- immutability and repeatability.

### Commands

- room configuration and project settings,
- obstacle add/update/remove,
- deterministic ID injection and collision,
- missing and locked entities,
- no-op versus state-changing results,
- invalid layouts applied with issues,
- malformed/unknown commands and stable failures,
- structural sharing and JSON serialization.

### Store and integration

- initial validation,
- dispatch result/state synchronization,
- undo/redo boundaries and revision behavior,
- redo invalidation after a branch,
- 50-snapshot history cap,
- rejected/no-op history behavior,
- complete room-and-obstacle correction scenario through public APIs.

### Existing regressions to preserve

- catalog schema/data/query tests,
- catalog WebMCP schemas, handlers, registration, and bridge tests,
- route and shared UI tests,
- lint, type, duplicate, file-size, and full test gates.

## Scope boundary

Out of scope for Phase 6:

- any room editor, canvas, React component, React Three Fiber scene, drag/drop, snapping UI, or
  selection state,
- registering or changing WebMCP tools and recording caller/activity metadata,
- product placement/movement/removal and batch layout changes,
- product clearance zones, product/obstacle collisions, ceiling requirements, shopping-list totals,
  budget-exceeded validation, candidate generation, scoring, or a global solver,
- localStorage, auto-save, presets, demo reset, JSON import/export, or project migration logic,
- doors/windows as wall geometry, polygons, irregular rooms, arbitrary rotations, 3D mesh collision,
  or photo analysis,
- accounts, database, API routes, backend MCP, or deployment configuration.

## Exit gate

Phase 6 is complete when:

1. Versioned project and strict command schemas cover rooms, settings, and obstacles/unavailable
   zones without introducing equipment-placement state.
2. Pure geometry deterministically handles rotation, inclusive room bounds, height, and
   positive-area rectangle collisions with explicit edge-contact semantics.
3. The validator returns exhaustive, stable, structured issues without mutating state.
4. All Phase 6 mutations flow through one runtime-validated command executor and return stable,
   JSON-serializable results.
5. The vanilla Zustand store uses that executor and passes bounded undo/redo, branching, no-op,
   rejection, and initial-validation tests.
6. Geometry and project modules have no React, Zustand, Three.js, DOM, Next.js, localStorage,
   catalog-query, or WebMCP dependency.
7. The shared room/obstacle correction scenario passes entirely through `dispatch(command)`.
8. Focused tests, `npm run quality:quick`, and `npm run agent:verify` pass; `npm run build` also
   passes if implementation changed a build-sensitive boundary.

After the gate passes, remove Phase 6 from the active implementation index, delete this file, and
promote Phase 7 to a detailed plan. Git history remains the implementation record.

## Risks and controls

| Risk | Control |
|---|---|
| Coordinate or edge semantics differ between geometry, UI, and WebMCP | Fix them in this plan and cover rotations, boundaries, and contact explicitly before UI work. |
| Validation rejects intermediate layouts, preventing iterative correction | Separate schema/precondition failure from applied state with returned validation issues. |
| Locking is only cosmetic and an agent moves a protected wardrobe | Enforce locks in the shared command executor; unlocking is a separate undoable operation. |
| Zustand leaks into domain logic | Use a thin vanilla adapter outside `project` and enforce imports with a targeted check/test. |
| Undo records failures or loses redo rules | Specify one snapshot per real successful change and test rejection, no-op, branch, and cap behavior. |
| Phase 6 expands into equipment planning | Omit placement data and commands entirely; Phase 10 adds them and advances the format version before persistence is public. |
| Project types duplicate catalog enums or reverse dependencies | Reuse schema-level enums or move only neutral vocabulary to a shared module; never import catalog data/queries. |
| IDs make tests flaky or adapters diverge | Inject ID generation into the single executor and return created IDs in command results. |
| Detailed result envelopes become too large for agent calls | Return affected IDs and current issues, not whole history or duplicated project snapshots. |
