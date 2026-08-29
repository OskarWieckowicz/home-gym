# Phase 18 — Access requirements and deterministic routing

## Objective

Let the user and the agent state that a usable path must exist between two points in the room, and
have the application prove or disprove it deterministically after every layout change.

Today the only way to protect a passage is to draw an unavailable zone by hand and hope nobody
moves it. An access requirement states the intent once; the path is recalculated from current
geometry and never stored.

This is the phase that makes layout feedback feel alive: moving a rack visibly reroutes the path,
then breaks it.

## Dependencies

- Phase 17 use-zone semantics, `warning` severity, and the `ProjectAnalysis` shared read model.
  Routing extends that type rather than creating a parallel one, and `ACCESS_PATH_CROSSES_USE_ZONE`
  needs the warning severity to exist.
- Existing rectangular-room, integer-centimetre, and 90-degree-rotation geometry invariants.
- Existing wall elements, which already model doors and windows with a wall, offset, and width.

This phase does not depend on Phase 19. It reads placements as they exist today.

## Scope boundary

### Included

- persist an access requirement as intent: two endpoints and a minimum width;
- support door endpoints and explicit floor-target endpoints;
- derive the route deterministically on a 10 cm grid with a fixed neighbour and tie-break order;
- run a two-pass search that first avoids use zones and then allows them as traversable;
- report `clear`, `crosses-use-zone`, or `blocked` with a derived polyline;
- add project version 4 with a migration that only adds an empty `accessRequirements` array;
- extend `ProjectAnalysis` with resolved routes;
- add editor creation, inspection, and overlay for requirements and their current routes;
- add WebMCP capabilities for creating, updating, removing, and reading access requirements.

### Excluded

- manually drawn or draggable route polylines;
- door swing arcs, hinge direction, or automatically generated unavailable zones;
- several alternative routes, route ranking, or optimizing the layout around a route;
- navigation meshes, irregular rooms, or arbitrary rotation angles;
- building-code or accessibility certification claims;
- project items and placement modes, which remain Phase 19.

## Accepted domain decisions

### 1. The project stores intent, never the calculated path

```ts
type AccessEndpoint =
  | { kind: "door"; wallElementId: string }
  | { kind: "floor-target"; position: Position2D };

type AccessRequirement = {
  id: string;
  name: string;
  from: AccessEndpoint;
  to: AccessEndpoint;
  minimumWidthCm: number;
};
```

A door endpoint must reference an existing wall element with `kind: "door"`; a window is rejected.
A floor target is an explicit point chosen by the user or the agent, never inferred from an
obstacle. The user decides the width. The editor may offer 80 cm as a neutral default, but the
domain must not present that number as a legal or professional safety standard.

### 2. Routing rules

1. Use a deterministic 10 cm grid with a fixed neighbour order and a fixed tie-break rule.
2. Convert a door into an interior portal centred on its wall opening. Reject an opening narrower
   than the requested width with a structured error rather than silently routing through it.
3. Treat room bounds, equipment physical footprints, physical obstacles, and unavailable zones as
   hard blockers expanded by half the required route width.
4. First search for a path that also avoids every use zone.
5. If none exists, search again treating use zones as traversable weighted areas.
6. Return the status, the path length, the IDs of any crossed use zones, and a simplified polyline
   for display.
7. Emit `ACCESS_PATH_CROSSES_USE_ZONE` as a warning and `ACCESS_PATH_BLOCKED` as an error.
8. Recalculate after every mutation. Never serialize the polyline.

The route proves connectivity at the chosen grid resolution. It is not a centimetre-exact
architectural guarantee, and the copy must say so.

### 3. Project version 4 is deliberately trivial

The v3 → v4 migration adds `accessRequirements: []` and changes nothing else, matching the shape of
the existing `migrateV2ToV3`. Keeping it separate from the Phase 19 item split means each migration
stays small, independently testable, and independently revertible.

## Implementation tasks

### 1. Add the schema and project version 4

1. Add `accessRequirementSchema`, `accessEndpointSchema`, and an `ACCESS_REQUIREMENT_ID_PATTERN`
   following the existing pattern conventions in `schemas/project.ts`.
2. Bump `PROJECT_VERSION` to 4 and add `accessRequirements` to `gymProjectSchema`.
3. Extend `superRefine` with unique requirement IDs and reject an endpoint whose two sides are
   identical.
4. Register `migrateV3ToV4` in the `migrations` map and extend `SUPPORTED_PROJECT_VERSIONS`.
5. Update defaults, reset state, import and export, and localStorage hydration.

Referential integrity that depends on wall-element kind belongs in the resolver-backed boundary,
not in the pure schema, following the existing separation.

Checkpoint: v1, v2, and v3 projects all migrate to v4 without touching rooms, obstacles, wall
elements, placements, budget, or training goals; canonical v4 JSON round-trips.

### 2. Implement pure route geometry

1. Add geometry helpers for door portals, floor targets, blocker expansion, and grid occupancy in
   `src/features/geometry/`, importing no React, Zustand, or Three.js.
2. Implement the deterministic search, path reconstruction, and display simplification.
3. Implement the two-pass avoid-then-allow strategy over use zones.
4. Return a structured result carrying status, polyline, length, and crossed use-zone entity IDs.

Checkpoint: the same project produces byte-for-byte equivalent route data on repeated calls, and
moving one blocker deterministically changes or restores the route.

### 3. Integrate routes into the shared analysis

1. Extend `ProjectAnalysis` with a resolved route per requirement.
2. Emit `ACCESS_PATH_CROSSES_USE_ZONE` warnings and `ACCESS_PATH_BLOCKED` errors into the existing
   sorted issue list, preserving the stable ordering rule.
3. Add structured issues for a dangling endpoint, an endpoint referencing a window, an endpoint
   buried in solid geometry, and a door opening narrower than the requested width.

Checkpoint: a blocked required route makes the project invalid; a route that only crosses a use
zone leaves it valid with a warning.

### 4. Add commands and editor controls

1. Add commands for creating, updating, and removing an access requirement, sharing revision,
   history, undo and redo, autosave, and structured results with every other mutation.
2. Removing a door must produce an explicit, enumerated consequence for any requirement that
   referenced it rather than a silently dangling reference.
3. Add editor creation and inspection with door or floor-target endpoints and an explicit width.
4. Render the derived path as an overlay, with distinct treatments for clear, crossing, and blocked,
   and keep it visibly derived rather than editable.

Checkpoint: the user can create a door-to-door requirement, watch it reroute while dragging a rack,
and see it fail; undo restores both the layout and the reported route.

### 5. Extend the WebMCP contract

1. Add narrowly scoped tools to create, update, remove, and list access requirements. Do not add a
   generic geometry or pathfinding tool.
2. Include resolved routes, their status, and crossed use-zone IDs in project-state and analysis
   results.
3. Validate every argument with strict Zod schemas that produce unambiguous JSON Schema.
4. Ensure a dangling endpoint, a window reference, cancellation, or an unexpected failure leaves
   state untouched.
5. Keep handlers free of geometry: they dispatch shared commands and serialize detached results.

Checkpoint: an agent can add a requirement, observe a blocked route, move equipment, and verify the
restored route through structured results while the same change is visible in the editor.

## Acceptance criteria

- An access requirement persists only its intent; no polyline appears in exported JSON.
- A door endpoint cannot reference a window.
- A door narrower than the requested width produces a structured error rather than a false route.
- A floor target buried in solid geometry cannot produce a successful route.
- A route is recalculated after every mutation and can move without the stored requirement changing.
- A route forced through a use zone returns a warning; no corridor of the requested width returns
  an error.
- Repeated analysis of an unchanged project returns equivalent structured route data.
- Removing a referenced door produces an explicit enumerated consequence.
- v1, v2, and v3 projects migrate to v4 without data loss and without inventing requirements.
- UI and WebMCP share commands, revision, undo and redo, persistence, and analysis.
- No source or configuration file exceeds 500 physical lines.

## Tests and verification

### Narrow automated checks

1. Schema tests for requirement IDs, endpoint validity, width bounds, and identical endpoints.
2. Migration and codec tests for v1→v4, v2→v4, v3→v4, and v4 round-trip serialization.
3. Routing tests for narrow doors, blocked endpoints, exact-width corridors, alternative paths,
   use-zone-only paths, complete blockage, all four rotations, and deterministic tie-breaking.
4. Analysis tests for route issues, severity, and stable ordering alongside existing issues.
5. Command and store tests for requirement CRUD, the removed-door consequence, no-ops, undo and
   redo, and revision.
6. Persistence tests for localStorage, import and export, and reset.
7. Component tests for requirement creation, the inspector, and the three overlay states.
8. WebMCP schema, handler, registration, cancellation, and detached-result tests.

### Manual scenario

1. Add an entrance door and a balcony door to the room.
2. Create an 80 cm requirement between them and confirm a clear route.
3. Drag equipment until the route reroutes, then until it only passes through a use zone, then
   until it is blocked.
4. Confirm the warning, then the error, then undo back to a clear route.
5. Ask the agent to read the analysis and correct the blocking placement through WebMCP.
6. Export, re-import, and confirm the requirement survives and the polyline does not.

### Validation ladder

1. Run the geometry, routing, migration, and analysis suites after each task.
2. Run `npm run quality:quick` after tasks 3 and 5.
3. Run `npm run lint:report` during cleanup; routing is the most likely place to approach the
   500-line limit, so split search, portals, and occupancy early.
4. Run `npm run agent:verify` as the exit gate.
5. Run `npm run build` because this phase changes serialized data contracts consumed by client
   integration.

## Exit gate

Phase 18 is complete when access requirements persist as intent, routes derive deterministically
and never serialize, the two-pass search and its status values are proven by tests, v3 → v4
migration and v4 round-trip pass, the editor shows rerouting and failure live, WebMCP exposes the
same capabilities through shared commands, and the canonical validation ladder passes.

## Cut line

If the deadline forces a cut, this phase is the one to drop. Phase 17 stands alone as a coherent
deployable boundary, and the existing manual unavailable-zone workaround still protects a passage.
Do not ship a partially persisted access entity or a UI-only pathfinder.
