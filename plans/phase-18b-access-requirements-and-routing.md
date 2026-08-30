# Phase 18b — Access requirements and deterministic routing

> Status: deferred. This phase is not next. Phase 19 owns the upcoming schema bump. Return here
> after Phase 19, or after Phase 20 if the 3D preview is the tighter deadline item. Do not start
> this work while 16 or 19 is in progress.

## Objective

Let the user and the agent state that a usable path of a chosen width must exist between two
specific points, have the application prove or disprove it deterministically after every layout
change, and show the resulting route in the plan.

Phase 18a already guarantees that the room stays walkable and that nothing becomes unreachable. This
phase adds the layer above that guarantee: a named, persisted intent that survives sessions, a
concrete route to look at, and an explicit width that the automatic check deliberately does not let
anyone tune.

This is the phase that makes layout feedback feel alive: moving a rack visibly reroutes the path,
then breaks it.

## Dependencies

- Phase 18a occupancy grid, clearance map, component labelling, access facts on `ProjectAnalysis`,
  and the agent access contract. This phase adds search and presentation on top of that machinery
  rather than rebuilding it.
- Phase 17 use-zone semantics, `warning` severity, and the shared analysis type.
- Existing rectangular-room, integer-centimetre, and 90-degree-rotation geometry invariants.
- Existing wall elements, which already model doors and windows with a wall, offset, and width.

This phase does not depend on Phase 19's item split. It reads placements as they exist when the
phase starts. If Phase 19 has already shipped, this phase still only appends
`accessRequirements: []`; it does not revisit items, budget, or `remove_product`.

## Scope boundary

### Included

- persist an access requirement as intent: two endpoints and a minimum width;
- support door endpoints and explicit floor-target endpoints;
- derive the route deterministically on the Phase 18a grid with a fixed neighbour and tie-break
  order;
- run a two-pass search that first avoids reserved areas and then allows them as traversable;
- report `clear`, `crosses-reserved-area`, or `blocked` with a derived polyline and the narrowest
  width along the route;
- bump the then-current project version with a migration that only adds an empty
  `accessRequirements` array;
- extend `ProjectAnalysis` with resolved routes next to the Phase 18a access facts;
- add editor creation, inspection, and overlay for requirements and their current routes;
- add WebMCP capabilities for creating, updating, removing, and reading access requirements, plus
  `check_access` as a read-only question that persists nothing.

### Excluded

- manually drawn or draggable route polylines, and any path entity stored in the project;
- hypothetical "what if I place it here" evaluation, which belongs with placement candidates in
  Phase 21;
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

A route is never an entity and never serialized. A stored polyline would describe a layout that no
longer exists as soon as anything moves, and an agent that draws geometry would be replacing the
deterministic engine instead of interpreting it.

### 2. Routing rules

1. Reuse the Phase 18a grid, clearance map, and blocker rules. Do not introduce a second occupancy
   model, and do not widen the blocker set: only solid geometry blocks a person here too.
2. Threshold the clearance map at half the requested width rather than expanding blockers per
   requirement, so one map serves every width.
3. Search with a fixed neighbour order and a fixed tie-break rule.
4. Convert a door into an interior portal centred on its wall opening. Reject an opening narrower
   than the requested width with a structured error rather than silently routing through it. This is
   the check Phase 18a deliberately omits, because here the width is stated by the user.
5. First search for a path that also avoids every **reserved area**: every use zone and every
   unavailable zone.
6. If none exists, search again treating reserved areas as traversable weighted areas, so the route
   crosses as little of them as possible.
7. Return the status, the path length, the narrowest width along the route, the IDs and kinds of any
   crossed reserved areas, and a simplified polyline for display.
8. Emit `ACCESS_PATH_CROSSES_USE_ZONE` and `ACCESS_PATH_CROSSES_UNAVAILABLE_ZONE` as warnings and
   `ACCESS_PATH_BLOCKED` as an error.
9. Recalculate after every mutation. Never serialize the polyline.

The route proves connectivity at the chosen grid resolution. It is not a centimetre-exact
architectural guarantee, and the copy must say so.

### 3. Reserved areas are soft, never solid

Phase 18a establishes that only geometry with a height blocks a person: use zones and unavailable
zones are walkable floor carrying a rule, not obstructions. This phase must not quietly reverse that
by promoting either of them back into the blocker set, because an unavailable zone drawn across a
doorway to reserve door swing space would then make every requirement through that door fail.

What changes here is preference, not passability. A declared route should avoid the space in front
of a rack and the floor someone reserved for another purpose, but when there is no alternative it
should say so rather than claim no passage exists. Both kinds therefore share one mechanism — the
avoid-then-allow pass — and differ only in the code they report, so the user can tell "the route
runs through your squat area" from "the route runs through the floor you set aside".

### 4. `check_access` is a question, not an entity

A read-only tool answering "is there a path of this width between these two things" lets an agent
interrogate the geometry without creating anything, without touching history, and without the
project growing state that only the agent understands. It persists nothing and is not required for
correctness: Phase 18a already pushes access facts into every result whether or not the agent asks.

### 5. The version bump is deliberately trivial

The migration adds `accessRequirements: []` and changes nothing else, matching the shape of the
existing `migrateV2ToV3`. Phase 19 is expected to own v3 → v4 for the item split, so this phase
bumps whatever `PROJECT_VERSION` is current when it starts — v4 → v5 if 19 has shipped, v3 → v4
only if this phase is pulled forward first. Keeping the bump separate from the item split means
each migration stays small, independently testable, and independently revertible. Phase 18a
introduced no schema change at all.

## Implementation tasks

### 1. Add the schema and the next project version

1. Add `accessRequirementSchema`, `accessEndpointSchema`, and an `ACCESS_REQUIREMENT_ID_PATTERN`
   following the existing pattern conventions in `schemas/project.ts`.
2. Bump `PROJECT_VERSION` by one from whatever is current and add `accessRequirements` to
   `gymProjectSchema`.
3. Extend `superRefine` with unique requirement IDs and reject a requirement whose two endpoints are
   identical.
4. Register the new migration in the `migrations` map and extend `SUPPORTED_PROJECT_VERSIONS`.
5. Update defaults, reset state, import and export, and localStorage hydration.

Referential integrity that depends on wall-element kind belongs in the resolver-backed boundary,
not in the pure schema, following the existing separation.

Checkpoint: every older supported version migrates to the new current version without touching
rooms, obstacles, wall elements, placements, budget, items, or training goals, and without
inventing requirements; canonical JSON round-trips.

### 2. Implement route search on the existing grid

1. Add portal and floor-target resolution beside the Phase 18a target helpers in
   `src/features/geometry/`, importing no React, Zustand, or Three.js.
2. Implement the deterministic search, path reconstruction, narrowest-width measurement, and display
   simplification as separate modules so none approaches the 500-line limit.
3. Implement the two-pass avoid-then-allow strategy over reserved areas, collecting use zones and
   unavailable zones into one soft-area set rather than two parallel code paths.
4. Return a structured result carrying status, polyline, length, narrowest width, and the crossed
   reserved areas with their entity IDs and kinds.

Checkpoint: the same project produces byte-for-byte equivalent route data on repeated calls, and
moving one blocker deterministically changes or restores the route.

### 3. Integrate routes into the shared analysis

1. Extend `ProjectAnalysis` with a resolved route per requirement, alongside the Phase 18a facts.
2. Emit `ACCESS_PATH_CROSSES_USE_ZONE` and `ACCESS_PATH_CROSSES_UNAVAILABLE_ZONE` warnings and
   `ACCESS_PATH_BLOCKED` errors into the existing sorted issue list, preserving the stable ordering
   rule.
3. Add structured issues for a dangling endpoint, an endpoint referencing a window, an endpoint
   buried in solid geometry, and a door opening narrower than the requested width.
4. Extend the Phase 18a access impact so a change that breaks a required route names it too.

Checkpoint: a blocked required route makes the project invalid; a route that only crosses a reserved
area leaves it valid with a warning naming the area it crossed.

### 4. Add commands and editor controls

1. Add commands for creating, updating, and removing an access requirement, sharing revision,
   history, undo and redo, autosave, and structured results with every other mutation.
2. Removing a door must produce an explicit, enumerated consequence for any requirement that
   referenced it rather than a silently dangling reference.
3. Add editor creation and inspection with door or floor-target endpoints and an explicit width.
4. Render the derived route as a translucent band of the required width with footprints along its
   centreline, in distinct treatments for clear, crossing, and blocked. The band carries the width
   that footprints alone cannot express. Keep the overlay non-interactive and announced as derived,
   so nobody tries to drag it.

Checkpoint: the user can create a door-to-door requirement, watch it reroute while dragging a rack,
and see it fail; undo restores both the layout and the reported route.

### 5. Extend the WebMCP contract

1. Add narrowly scoped tools to create, update, remove, and list access requirements, plus
   `check_access` returning reachability, narrowest width, length, and crossed reserved areas for an
   ad-hoc pair. Do not add a generic geometry or pathfinding tool.
2. Include resolved routes, their status, and crossed reserved-area IDs and kinds in project-state
   and analysis results.
3. State in the `check_access` description that a crossed use zone or unavailable zone lowers the
   quality of a route but does not mean the path is impossible, so the agent does not read a warning
   as a blockage.
4. Validate every argument with strict Zod schemas that produce unambiguous JSON Schema.
5. Ensure a dangling endpoint, a window reference, cancellation, or an unexpected failure leaves
   state untouched.
6. Keep handlers free of geometry: they dispatch shared commands or read the shared analysis, and
   serialize detached results.

Checkpoint: an agent can add a requirement, observe a blocked route, move equipment, and verify the
restored route through structured results while the same change is visible in the editor.

## Acceptance criteria

- An access requirement persists only its intent; no polyline appears in exported JSON.
- A door endpoint cannot reference a window.
- A door narrower than the requested width produces a structured error rather than a false route.
- A floor target buried in solid geometry cannot produce a successful route.
- A route is recalculated after every mutation and can move without the stored requirement changing.
- A route forced through a use zone or an unavailable zone returns a warning naming that area; no
  corridor of the requested width returns an error.
- A route prefers a clear corridor over an equally long one crossing a reserved area.
- An unavailable zone drawn across a doorway never turns a satisfiable requirement into a blocked
  one; neither use zones nor unavailable zones ever enter the blocker set.
- A route result reports the narrowest width along the route.
- Repeated analysis of an unchanged project returns equivalent structured route data.
- `check_access` changes no state, no revision, and no history.
- Removing a referenced door produces an explicit enumerated consequence.
- older supported versions migrate to the new current version without data loss and without
  inventing requirements.
- UI and WebMCP share commands, revision, undo and redo, persistence, and analysis.
- Route search reuses the Phase 18a grid rather than introducing a second occupancy model.
- No source or configuration file exceeds 500 physical lines.

## Tests and verification

### Narrow automated checks

1. Schema tests for requirement IDs, endpoint validity, width bounds, and identical endpoints.
2. Migration and codec tests from every older supported version to the new current version, and
   canonical round-trip serialization.
3. Routing tests for narrow doors, blocked endpoints, exact-width corridors, alternative paths,
   complete blockage, all four rotations, narrowest-width measurement, and deterministic
   tie-breaking.
4. Reserved-area tests: a path available only through a use zone, only through an unavailable zone,
   and only through both; a clear corridor preferred over an equal-length crossing one; an
   unavailable zone over a doorway leaving the requirement satisfiable; and each crossed area
   reported with the correct code and entity ID.
5. Analysis tests for route issues, severity, and stable ordering alongside existing issues.
6. Command and store tests for requirement CRUD, the removed-door consequence, no-ops, undo and
   redo, and revision.
7. Persistence tests for localStorage, import and export, and reset.
8. Component tests for requirement creation, the inspector, and the three overlay states.
9. WebMCP schema, handler, registration, cancellation, and detached-result tests, including
   `check_access` leaving revision and history untouched.

### Manual scenario

1. Add an entrance door and a balcony door to the room.
2. Create an 80 cm requirement between them and confirm a clear route with footprints.
3. Drag equipment until the route reroutes, then until it only passes through a use zone, then
   until it is blocked.
4. Confirm the warning, then the error, then undo back to a clear route.
5. Draw an unavailable zone across the balcony doorway and confirm the route still exists, now
   reported as crossing a reserved area rather than blocked.
6. Ask the agent to read the analysis and correct the blocking placement through WebMCP.
7. Export, re-import, and confirm the requirement survives and the polyline does not.

### Validation ladder

1. Run the geometry, routing, migration, and analysis suites after each task.
2. Run `npm run quality:quick` after tasks 3 and 5.
3. Run `npm run lint:report` during cleanup; routing is the most likely place to approach the
   500-line limit, so split search, portals, and simplification early.
4. Run `npm run agent:verify` as the exit gate.
5. Run `npm run build` because this phase changes serialized data contracts consumed by client
   integration.

## Exit gate

Phase 18b is complete when access requirements persist as intent, routes derive deterministically
from the Phase 18a grid and never serialize, reserved areas stay soft rather than solid, the two-pass
search and its status values are proven by tests, the additive `accessRequirements` migration and
round-trip pass, the
editor shows rerouting and failure live, WebMCP
exposes the same capabilities through shared commands plus a stateless `check_access`, and the
canonical validation ladder passes.

## Cut line

This phase is already deferred. If the deadline still forces a cut later, drop it rather than
pulling it ahead of Phase 16 or 19, and do not drop Phase 18a. Phase 18a already prevents an agent
from making the room unwalkable, which is the load-bearing behaviour; this phase adds the named
intent, the visible route, and the demo. Within the phase, the overlay and `check_access` are
the last items to add and the first to drop. Do not ship a partially persisted access entity or a
UI-only pathfinder.
