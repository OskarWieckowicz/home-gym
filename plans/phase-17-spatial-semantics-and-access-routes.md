# Phase 17 — Spatial semantics, strength stations, and access routes

## Objective

Replace the overloaded single-product `clearance` model with deterministic spatial semantics that
can represent independently placed equipment, products selected without a floor placement, one
controlled rack/bench/barbell station, and flexible access between important room targets.

The phase must make the same rules available to manual editing and WebMCP. The resulting project
analysis must tell both the user and the agent which conflicts are hard errors, which overlaps are
warnings, and whether a required access route still exists after every layout change.

## Dependencies

- Phase 12 deterministic equipment placement, validation, store, history, and project-v3
  persistence.
- Phase 13 creator equipment tools and their current shared-editing contract.
- Phase 16 product-family decisions, especially the explicit requirement to plan supported
  rack/bench/barbell nesting before presenting a strength-station composition as valid.
- The current rectangular-room, integer-centimetre, and 90-degree-rotation geometry invariants.

This phase must complete before placement suggestions, batch layout changes, final 3D validation
presentation, or the shared-editing demo are treated as stable. Those consumers must build on the
new project analysis rather than reproduce the old clearance assumptions.

## Scope boundary

### Included

- rename the product-level spatial concept from generic `clearance` to `useZone` in the domain,
  tool results, validation messages, and editor copy;
- distinguish project products from their optional floor placements;
- retain a small floor/storage representation for a loose barbell while allowing it to participate
  in a station without an independent placement;
- support catalog products that can be selected and priced but cannot be independently placed;
- introduce exactly one controlled MVP station template for rack + bench + optional barbell and
  plates;
- distinguish validation errors from warnings and add use-zone overlap warnings;
- persist access requirements while deriving their current paths deterministically;
- support access endpoints at doors and explicit floor targets, with a required minimum width;
- expose project items, stations, access requirements, resolved routes, and structured issues to
  both the UI and WebMCP;
- migrate saved projects from version 3 to version 4 without silently losing products, positions,
  rotations, or cost.

### Excluded

- user-authored station templates or arbitrary overlap-exception groups;
- automatically inferring a station from proximity;
- modeling a barbell resting on rack hooks as independent collision geometry;
- exercise-by-exercise animation, simultaneous-use scheduling, or workout planning;
- manually drawn or draggable route polylines;
- door swing arcs, hinge direction, or automatic unavailable zones;
- building-code certification, ergonomic certification, or claims that a generated layout is
  professionally safe;
- irregular rooms, arbitrary equipment rotations, polygon-union rendering, navigation meshes, or
  a global room-layout optimizer;
- generating several alternative paths or optimizing the whole layout around every path.

## Accepted domain decisions

### 1. Physical footprints and use zones remain different concepts

`physical` is the floor area occupied by the placed object. `useZone` is additional empty space
needed to operate or access it. A use zone is not itself a solid object, so two empty use zones may
share floor space. A physical object entering a foreign use zone remains a hard conflict.

The MVP keeps the existing asymmetric front/back/left/right margin representation and rectangular
AABB calculations. It does not introduce arbitrary zone polygons or exercise-specific zone shapes
in this phase.

| Relationship | Result |
|---|---|
| physical footprint ↔ physical footprint | error |
| physical footprint ↔ physical obstacle or unavailable zone | error |
| physical footprint or use zone ↔ room bounds | error |
| use zone ↔ physical obstacle or unavailable zone | error |
| physical footprint ↔ use zone of an unrelated item/station | error |
| physical footprint ↔ use zone permitted by the same station template | allowed |
| use zone ↔ use zone of unrelated items/stations | warning |
| physical footprint ↔ physical footprint inside a station | error |

An analysis is spatially valid when it contains no issues with severity `error`. Warnings remain
visible and structured but do not make the project invalid.

The rack/bench template may authorize only `useZone ↔ physical` overlap for declared member roles.
It must not suppress physical AABB collisions. For the MVP, the rack and bench must therefore be
positioned without overlapping their physical rectangles; more accurate open-frame rack geometry
is a later geometry decision.

### 2. Product selection is independent from floor placement

Project version 4 introduces stable item identity:

```ts
type ProjectItem = {
  id: string;
  productId: string;
};

type Placement = {
  id: string;
  projectItemId: string;
  position: Position2D;
  rotation: Rotation;
};
```

Rules:

- the shopping list, budget, and training-goal coverage derive from `projectItems`;
- each item is counted exactly once regardless of placement or station membership;
- an item may have zero or one placement;
- removing a placement keeps the item in the project;
- removing an item also removes its placement and station membership in one explicit atomic
  command result;
- the result must enumerate every cascading removal so UI and agent can verify the mutation;
- migration and import reject dangling or duplicate item references.

The product catalog adds `placementMode: "floor" | "selection-only"` and optional station roles.
A floor product can still be an unplaced station member. A `selection-only` product can appear in
search, product details, the project list, budget, and summary, but UI commands and WebMCP must
reject attempts to give it a floor placement.

Barbells remain `floor` products for the case where one is intentionally stored loose. Their
product-level use zone becomes a small handling/storage margin. The large exercise envelope comes
from the rack/bench station or a future deadlift station, not from a stored barbell product.

### 3. The MVP exposes one controlled strength-station template

```ts
type Station = {
  id: string;
  templateId: "rack-bench-press";
  name: string;
  projectItemIds: string[];
};
```

The template contract is deliberately closed:

- exactly one rack role and one bench role are required;
- a barbell role and plates role are optional;
- a member item belongs to at most one station;
- catalog roles, not category-name guesses, determine compatibility;
- rack, bench, and plates require placements; a barbell may remain unplaced because its physical
  storage is represented by the station in this one controlled template;
- missing required roles or required placements produce `STATION_INCOMPLETE` with severity
  `error`;
- only declared role pairs may ignore a member footprint entering another member's use zone;
- physical footprint collisions are never ignored;
- the station's effective use area is the deterministic collection/union of its placed members'
  rectangular use zones; the MVP renderer may show those rectangles separately instead of
  calculating a polygon union.

This is not a generic grouping feature. A station exists to express a known spatial compatibility
and must not become a user-controlled escape hatch from validation.

### 4. Access is a persisted requirement and a derived route

The project stores the intent, never the calculated polyline:

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

Door references must target existing wall elements with `kind: "door"`. A floor target represents
an explicit access point near furniture or another destination; it is not automatically inferred
from an obstacle. The user or agent decides the required width. The editor may offer 80 cm as a
neutral product default, but the domain must not present that value as a legal or professional
safety standard.

Routing rules:

1. Use a deterministic 10 cm grid and a fixed neighbour/tie-break order.
2. Convert a door to an interior portal centred on its wall opening; reject an opening that cannot
   admit the requested width.
3. Treat room bounds, equipment footprints, physical obstacles, and unavailable zones as hard
   blockers expanded by half the required route width.
4. First search for a route that also avoids all use zones.
5. If none exists, search again with use zones as traversable weighted areas.
6. Return `clear`, `crosses-use-zone`, or `blocked` plus a deterministic derived polyline.
7. Emit `ACCESS_PATH_CROSSES_USE_ZONE` as a warning and `ACCESS_PATH_BLOCKED` as an error.
8. Recalculate analysis after every project mutation; never save the derived polyline in JSON.

The route proves connectivity at the selected grid resolution. It does not claim centimetre-level
architectural certification.

### 5. Analysis becomes the shared read model

Introduce a pure `analyzeProject(project, dependencies): ProjectAnalysis` that returns:

- sorted validation issues;
- `valid`, derived only from error-severity issues;
- resolved item/product/station facts needed by presentation;
- a resolved route result for every access requirement.

Keep `validateProject` as a compatibility wrapper during migration if doing so avoids a broad
one-step rewrite. UI, commands, persistence checks, summaries, placement suggestions, and WebMCP
must converge on the same analysis function by the phase exit gate.

## Project-v4 migration contract

Add a deterministic `v3 → v4` migration and extend the complete `v1 → current` chain.

1. Create exactly one `ProjectItem` for every version-3 placement.
2. Derive the item ID deterministically from the unique placement ID using the canonical item-ID
   prefix; fail migration on an impossible collision instead of generating random data.
3. Replace `placement.productId` with the corresponding `placement.projectItemId`.
4. Add `stations: []` and `accessRequirements: []`.
5. Do not infer station membership, access requirements, or door routes from coordinates.
6. Preserve every product reference, placement ID, position, rotation, room fact, obstacle, wall
   element, budget, and training goal.
7. Preserve shopping cost: a migrated placement becomes one project item and is counted once.
8. Do not silently delete or attach legacy barbell placements. They migrate as ordinary floor
   placements and use the revised loose-storage use zone; the UI may explain the changed catalog
   semantics but must not invent a station.

Add a checked-in representative version-3 fixture based on the supplied room scenario. The fixture
must not depend on a file remaining in `Downloads`. After migration it must contain four project
items, four placements, no stations, no access requirements, and unchanged coordinates, rotations,
product count, and cost.

## Implementation tasks

### Slice A — Product, station, and use-zone semantics

#### 1. Freeze contracts and update architecture documentation

1. Update `PRODUCT_CONCEPT.md`, `TECHNICAL_ARCHITECTURE.md`, `EDITOR_MOCKUP.md`, and the agent
   workflow prompt with the accepted terms and validation matrix.
2. Document the item/placement split, closed station template, route requirement, warning/error
   semantics, and the fact that wall elements still do not create unavailable zones automatically.
3. Add concrete v4 and analysis examples before changing runtime behavior.

Checkpoint: the examples answer who owns cost, which products can be placed, which overlaps are
allowed, and what is persisted versus derived without relying on UI behavior.

#### 2. Extend product spatial metadata

1. Replace catalog `clearance` with `useZone` and add `placementMode` plus typed station roles.
2. Update all catalog seeds and runtime catalog validation.
3. Give loose barbells small storage/handling zones and assign their station role.
4. Add one genuinely non-spatial accessory as the `selection-only` MVP proof. Do not reclassify a
   currently placeable catalog product in this phase, because a version-3 project may already
   contain its placement and migration must not discard it. Do not use the flag to hide difficult
   geometry for otherwise floor-occupying products.
5. Return the new facts from catalog queries and WebMCP product details.

Checkpoint: every catalog item declares an explicit placement mode; all station roles are valid;
no barbell creates a full exercise envelope by itself.

#### 3. Implement project version 4 and migration

1. Add schemas and ID patterns for project items, stations, access requirements, and endpoints.
2. Change placement references from product IDs to project-item IDs.
3. Add structural referential-integrity checks for unique IDs, item-to-placement cardinality,
   station membership, and endpoint references. Enforce catalog-dependent placement capabilities
   and station roles in a resolver-backed project boundary rather than importing catalog data into
   the pure project schema.
4. Add the v3→v4 migration, the representative supplied-project fixture, codec round trips, and
   complete v1/v2/v3 migration-chain tests.
5. Update defaults, reset state, import/export, localStorage hydration, and unknown-product checks.

Checkpoint: old projects import without data loss; canonical v4 JSON round-trips; malformed or
dangling references fail at the persistence boundary with stable errors.

#### 4. Route item, placement, and station mutations through shared commands

1. Add commands for adding/removing a project item, placing/unplacing an existing item, and
   creating/updating/removing the one supported station template.
2. Preserve `place_product` as an atomic convenience flow for floor products: create one item and
   one placement in one revision and one undo step.
3. Make item removal enumerate and atomically apply removal of its placement and station
   membership; make placement removal preserve the item.
4. Reject placement of `selection-only` items and invalid station roles before mutation.
5. Update store ID generation, history, undo/redo, autosave, revision, affected IDs, and detached
   structured results.

Checkpoint: manual and handler-driven commands produce identical project, revision, history, and
analysis outcomes, including cascades and no-op behavior.

#### 5. Replace clearance validation with use-zone/station analysis

1. Keep current bounds, height, obstacle, unavailable-zone, and physical-collision rules.
2. Implement the accepted relationship matrix and stable issue ordering.
3. Add `USE_ZONE_OVERLAP` warnings for unrelated item/station use zones.
4. Apply the template exception only to declared member roles and only to use-zone/physical
   conflicts; prove physical collisions are still errors.
5. Add `STATION_INCOMPLETE` and station-reference issues with structured details.
6. Move budget and coverage calculation from placements to project items.
7. Introduce `ProjectAnalysis` and migrate current validation consumers to it.

Checkpoint: the rack/bench/barbell scenario is analyzable without a fake standalone barbell
exercise zone, unrelated footprint/use-zone conflicts remain errors, and warnings alone do not
invalidate the project.

### Slice B — Flexible access requirements

Slice B begins only after Slice A's schemas and `ProjectAnalysis` contract are stable.

#### 6. Implement deterministic access routing

1. Add pure geometry helpers for door portals, floor targets, blocker expansion, grid occupancy,
   deterministic search, path reconstruction, and path simplification for display.
2. Implement the two-pass avoid-use-zone / allow-use-zone search.
3. Return structured status, path length, crossed use-zone entity IDs, and derived polyline.
4. Add blocked-endpoint, insufficient-door-width, no-path, exact-width, alternative-route,
   rotation, and deterministic tie-break tests.
5. Integrate route issues and results into `ProjectAnalysis` without importing React, Zustand, or
   Three.js into geometry/project modules.

Checkpoint: moving one blocker deterministically changes or restores the route and repeated
analysis returns byte-for-byte equivalent structured route data.

#### 7. Add editor controls and overlays

1. Show `Place` only for floor-capable products and `Add to project` for selection-only products.
2. Present project items separately from placements and show placed, unplaced, and station-member
   state.
3. Provide the closed rack/bench-press station action and an inspector for its supported members.
4. Add access-requirement creation/inspection with door or floor-target endpoints and width.
5. Render use zones, station membership, derived access paths, warnings, and hard errors without
   making rendered geometry the validation source of truth.
6. Preserve the palette → plan → inspector interaction and make agent mutations visible in the
   same editor/history.

Checkpoint: the user can create the representative strength station and a bottom-door → balcony-
door route, then see route rerouting or failure immediately while moving equipment.

#### 8. Extend WebMCP contracts through the same domain commands

1. Extend project-state and validation/analysis results with items, placements, stations, access
   requirements, resolved routes, severities, and cascaded affected IDs.
2. Preserve `place_product(productId, position, rotation)` for atomic select-and-place. Add
   `add_product_to_project(productId)`, `place_project_item(projectItemId, ...)`, and
   `unplace_product(placementId)`. Change `remove_product` to receive `projectItemId` and remove the
   shopping item plus any placement/station membership, returning those cascades explicitly.
   Add narrowly scoped station and access-requirement capabilities rather than a generic grouping
   or geometry tool.
3. Validate every argument with strict Zod schemas that have unambiguous JSON Schema output.
4. Ensure `selection-only` placement attempts, invalid station roles, dangling endpoints,
   cancellation, and unexpected failures do not mutate state.
5. Keep tool handlers free of geometry and station business rules; they dispatch shared commands
   and serialize detached `ProjectAnalysis` results.

Checkpoint: an agent can read the room, add an unplaced barbell, construct the supported station,
add an access requirement, observe a blocked route, move equipment, and verify the restored route
through structured results and the visible UI.

#### 9. Integrate downstream consumers and close the phase

1. Update 2D and 3D selection/lookup code to resolve products through project items.
2. Update summaries, labels, issue rendering, reset/demo fixtures, and import/export examples.
3. Make later placement candidates reject error-producing layouts, include warnings in scoring,
   and treat blocked required routes as hard failures; implement the candidate engine only in its
   later phase.
4. Verify the representative v3 import and a complete manual-change → agent-read → agent-change →
   analysis → correction flow.
5. Reconcile Phase 16's visual manifest with products that are not independently placeable; do
   not remove their catalog or station visuals merely because they lack a floor placement.

Checkpoint: no UI, persistence, summary, 3D, WebMCP, or planned-suggestion consumer reads product
identity directly from the obsolete `placement.productId` shape.

## Acceptance criteria

- Project items, placements, and station membership have stable independent IDs and strict
  referential integrity.
- Shopping cost and training-goal coverage count every project item once, including unplaced and
  selection-only products.
- A selection-only product cannot be placed through UI, commands, import, or WebMCP.
- A loose barbell has a small storage/handling use zone; adding it to the strength station does not
  require a separate floor placement or create a second exercise-sized zone.
- The controlled rack/bench/barbell station permits only its declared use-zone/footprint
  relationships and never suppresses a physical collision.
- Use zones entering obstacles, unavailable zones, or room bounds remain errors.
- A physical item entering an unrelated use zone remains an error.
- Two unrelated use zones may overlap, but UI and WebMCP receive a deterministic warning.
- A project containing only warnings reports `valid: true`; any error reports `valid: false`.
- A required route is recalculated after every mutation and can move without changing the stored
  access requirement.
- A route that must cross a use zone returns a warning; a route with no corridor of the requested
  width returns a structured error.
- A door endpoint cannot reference a window, and a floor target blocked by solid geometry cannot
  produce a false successful route.
- UI and WebMCP mutations share commands, revision, undo/redo, persistence, and analysis.
- Version-3 projects migrate to version 4 without losing products, positions, rotations, budget,
  obstacles, wall elements, or training goals and without inventing stations or paths.
- Doors and windows still do not automatically create unavailable zones.

## Tests and verification

### Narrow automated checks

1. Product schema and catalog tests for `placementMode`, station roles, and use zones.
2. Project schema/boundary tests for IDs, cardinality, dangling references, catalog capabilities,
   and endpoint validity.
3. Migration/codec tests for v1→v4, v2→v4, v3→v4, representative-project migration, and v4
   round-trip serialization.
4. Command/store tests for item, placement, station, and access CRUD; cascades; no-ops;
   undo/redo; revision; and invalid input.
5. Geometry/analysis tests for the complete relationship matrix, edge touching, all rotations,
   station exceptions, stable sorting, and warning/error validity.
6. Routing tests for narrow doors, blocked endpoints, exact-width corridors, alternate paths,
   use-zone-only paths, full blockage, and deterministic tie-breaking.
7. Persistence tests for localStorage, import/export, reset, and unknown products.
8. Component tests for add-versus-place affordances, item/station/access inspectors, overlays, and
   issue presentation.
9. WebMCP schema, handler, registration, cancellation, detached-result, and shared-editing tests.

### Manual scenario

1. Import the representative version-3 room and verify its four products, placements, cost, and
   geometry.
2. Unplace the barbell without removing it from the project, then attach it to a rack/bench station.
3. Add an access requirement between the entrance and balcony door with an explicit width.
4. Move the rack or bench to force route rerouting, a use-zone crossing warning, and finally a
   blocked-route error.
5. Ask the agent to read the analysis and correct the blocking placement through WebMCP.
6. Confirm the visible result, revision, undo/redo, autosave, exported v4 JSON, and re-import.

### Validation ladder

1. Run the narrowest relevant Vitest/component suites after each task.
2. Run `npm run quality:quick` after each coherent Slice A and Slice B implementation checkpoint.
3. Run `npm run lint:report` during cleanup and split any source/configuration file approaching the
   500-line limit.
4. Run `npm run agent:verify` as the canonical exit gate.
5. Run `npm run build` before the public demo because this phase touches broad client integration
   and serialized data contracts, even if routing itself is unchanged.
6. Perform the real supported WebMCP scenario when the environment exposes the capability; record
   any runtime limitation honestly rather than substituting UI-only evidence.

## Review gates and ownership

- One owner must control project-v4 schemas, migrations, commands, and analysis result contracts.
- Pure use-zone and route geometry may be implemented independently only after those contracts are
  frozen.
- UI and WebMCP may proceed in parallel after command and analysis contracts stabilize; neither may
  introduce duplicate business rules.
- A reviewer is required after material changes to migration, use-zone/station validation,
  routing, and WebMCP contracts.
- Existing unrelated Phase 16 asset edits, especially in equipment rendering tests and visual
  registries, must be preserved and reconciled rather than reverted.

## Exit gate

Phase 17 is complete only when both slices pass their checkpoints; v3→v4 migration and canonical
v4 round-trip are proven; the representative strength station and flexible access-route scenario
work through both manual UI and shared WebMCP commands; error/warning semantics are consistent;
the canonical validation ladder passes; and no source/configuration file exceeds 500 physical
lines.

If the submission deadline forces a cut, finish Slice A as a coherent deployable boundary and keep
the existing manual unavailable-zone workaround for passage protection. Do not ship a partially
persisted access entity or duplicate UI-only pathfinding. Slice B remains the next phase rather
than weakening the shared-domain invariant.
