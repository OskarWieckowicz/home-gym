# Phase 19 — Project items, placement modes, and project v5

## Objective

Separate "this product is part of my plan" from "this product stands here on the floor".

Today `Placement` is the only representation of a product in a project, so a product exists only
once it occupies floor space. That has three consequences worth fixing: a user cannot add equipment
before deciding where it goes, non-spatial accessories such as resistance bands or a jump rope
cannot be part of a plan at all, and the budget in `validatePlacementRequirements` sums prices over
placements rather than over everything the user intends to buy.

## Dependencies

- Phase 17 use-zone semantics, severity, and the `ProjectAnalysis` shared read model.
- Phase 18b access requirements and project version 4, if that phase shipped. Phase 18a changes no
  schema, so it has no effect on this migration either way.

This phase is the heaviest and the most breaking of the three, and it is deliberately last. It
carries the only irreversible risk in the group, because a bad migration destroys saved work.

If Phase 18b was cut, this phase migrates v3 → v4 instead of v4 → v5. Everything else is unchanged.

## Scope boundary

### Included

- introduce `ProjectItem` and reference it from `Placement`;
- add catalog `placementMode: "floor" | "selection-only"`;
- move budget and training-goal coverage from placements to project items;
- add commands for adding and removing an item, and for placing and unplacing an existing item;
- keep `place_product` as an atomic select-and-place convenience flow;
- add a project version bump and migration with a checked-in representative fixture;
- extend `ProjectAnalysis` with resolved item facts;
- present items and placements distinctly in the editor;
- extend the WebMCP contract, including one breaking change to `remove_product`.

### Excluded

- station templates, product roles, and overlap exceptions, rejected in Phase 17;
- quantities greater than one per item, which stays one item per unit;
- inventory of equipment the user already owns, which is a separate product decision;
- placement suggestions and batch layout changes;
- changing any spatial rule, severity, or route behavior.

## Accepted domain decisions

### 1. Stable item identity

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
- each item counts exactly once regardless of whether it is placed;
- an item has zero or one placement;
- removing a placement keeps the item in the project;
- removing an item also removes its placement in one atomic command result that enumerates every
  cascading removal, so both the UI and the agent can verify the mutation;
- import and migration reject dangling or duplicate item references.

### 2. Placement mode

The catalog gains `placementMode: "floor" | "selection-only"`.

A `floor` product can be placed and can also sit unplaced in the project. A `selection-only`
product appears in search, product details, the project list, the budget, and the summary, but UI
commands, import, and WebMCP must reject any attempt to give it a floor placement.

Two constraints on how the flag is used. Do not reclassify a currently placeable catalog product in
this phase, because an existing saved project may already contain its placement and migration must
not discard it. Do not use the flag to hide difficult geometry for a product that genuinely
occupies floor space; add one genuinely non-spatial accessory as the proof.

### 3. Catalog capability belongs at the boundary

Whether a product may be placed is catalog knowledge. Enforce it in the resolver-backed project
boundary and in the commands, not inside the pure project schema, following the separation already
used for unknown-product checks in `catalogProductResolver` and `projectUsesKnownProducts`.

### 4. Migration contract

1. Create exactly one `ProjectItem` for every existing placement.
2. Derive the item ID deterministically from the unique placement ID using the canonical item-ID
   prefix. Fail migration on an impossible collision rather than generating random data.
3. Replace `placement.productId` with `placement.projectItemId`.
4. Add `projectItems`.
5. Preserve every product reference, placement ID, position, rotation, room fact, obstacle, wall
   element, access requirement, budget, and training goal.
6. Preserve cost: a migrated placement becomes one item and is counted once. Total project cost
   before and after migration must be identical.
7. Infer nothing. No grouping, no unplacing, no placement-mode reassignment.

Add a checked-in representative fixture based on the supplied four-product room scenario. It must
live in the repository and must not depend on a file in `Downloads`. After migration it contains
four project items, four placements, unchanged coordinates and rotations, and unchanged cost.

## Implementation tasks

### 1. Extend the catalog

1. Add `placementMode` to the product schema and to every seed, with no implicit default.
2. Add one genuinely non-spatial accessory as the `selection-only` proof.
3. Return the new fact from catalog queries, product details, and WebMCP product results.

Checkpoint: every catalog product declares an explicit placement mode.

### 2. Add the schema version and migration

1. Add `projectItemSchema` and a `PROJECT_ITEM_ID_PATTERN` following existing conventions.
2. Change `placementSchema` from `productId` to `projectItemId` and bump `PROJECT_VERSION`.
3. Extend `superRefine` with unique item IDs, at most one placement per item, and no dangling
   `projectItemId`.
4. Register the migration and extend `SUPPORTED_PROJECT_VERSIONS`.
5. Add the representative fixture and complete migration-chain tests from every supported version.
6. Update defaults, reset state, import and export, and localStorage hydration.

Checkpoint: every older version migrates without data or cost loss; canonical JSON round-trips;
dangling or duplicate references fail at the persistence boundary with stable errors.

### 3. Route mutations through shared commands

1. Add commands to add an item, remove an item, place an existing item, and unplace a placement.
2. Preserve `place_product` as an atomic flow that creates one item and one placement in a single
   revision and a single undo step.
3. Make item removal enumerate and atomically apply its placement removal; make placement removal
   preserve the item.
4. Reject placing a `selection-only` item before any mutation occurs.
5. Update ID generation, history, undo and redo, autosave, revision, affected IDs, and detached
   structured results.

Checkpoint: manual and agent-driven commands produce identical project, revision, history, and
analysis outcomes, including cascades and no-op behavior.

### 4. Move cost and coverage to items

1. Compute budget and training-goal coverage from `projectItems` in the analysis.
2. Extend `ProjectAnalysis` with resolved item facts needed by presentation: product, placement
   state, and placement capability.
3. Update `BUDGET_EXCEEDED` entity IDs and details to reference items.

Checkpoint: an unplaced item counts toward budget and coverage exactly once, and a placed item is
not double counted.

### 5. Update the editor

1. Show `Place` only for floor-capable products and `Add to project` for selection-only products.
2. Present project items as a list with placed and unplaced state, separate from the plan.
3. Allow unplacing without removing, and removing with a visible enumeration of what else goes.
4. Update 2D and 3D selection and lookup to resolve products through project items.
5. Update summaries, labels, issue rendering, reset and demo fixtures, and export examples.

Checkpoint: no UI, persistence, summary, or 3D consumer reads product identity from the obsolete
`placement.productId` shape.

### 6. Extend the WebMCP contract

1. Add `add_product_to_project(productId)`, `place_project_item(projectItemId, position, rotation)`,
   and `unplace_product(placementId)`.
2. Preserve `place_product(productId, position, rotation)` unchanged for atomic select-and-place.
3. Change `remove_product` to receive `projectItemId`, remove the item plus any placement, and
   return the cascade explicitly. This is a breaking change; make it deliberately and update every
   description, schema, test, and the agent workflow prompt in the same change.
4. Extend project-state and analysis results with items, their placement state, and cascaded
   affected IDs.
5. Ensure a selection-only placement attempt, a dangling item reference, cancellation, or an
   unexpected failure leaves state untouched.

Checkpoint: an agent can add an unplaced product, place it later, unplace it without losing it from
the budget, and remove it with a visible cascade.

## Acceptance criteria

- Project items and placements have stable independent IDs and strict referential integrity.
- Budget and training-goal coverage count every project item exactly once, including unplaced and
  selection-only products.
- A selection-only product cannot be placed through the UI, commands, import, or WebMCP.
- Unplacing keeps the item in the project and in the budget.
- Removing an item removes its placement in one atomic result that enumerates the cascade.
- `place_product` still creates one item and one placement in one revision and one undo step.
- Older projects migrate without losing products, positions, rotations, budget, obstacles, wall
  elements, access requirements, or training goals, and without inferring anything.
- Total project cost is identical before and after migration.
- No consumer reads product identity from `placement.productId`.
- UI and WebMCP share commands, revision, undo and redo, persistence, and analysis.
- No source or configuration file exceeds 500 physical lines.

## Tests and verification

### Narrow automated checks

1. Product schema and catalog tests for `placementMode` on every seed.
2. Project schema tests for item IDs, one-placement cardinality, dangling references, and duplicate
   items.
3. Boundary tests for catalog-dependent placement capability.
4. Migration and codec tests for every supported version to current, the representative fixture,
   cost preservation, and round-trip serialization.
5. Command and store tests for item and placement CRUD, cascades, no-ops, undo and redo, revision,
   and rejected selection-only placement.
6. Analysis tests for budget and coverage from items, including unplaced and selection-only.
7. Persistence tests for localStorage, import and export, reset, and unknown products.
8. Component tests for add-versus-place affordances, the item list, and cascade presentation.
9. WebMCP schema, handler, registration, cancellation, detached-result, and shared-editing tests,
   including the changed `remove_product` signature.

### Manual scenario

1. Import the representative older-version room and verify its four products, placements, cost, and
   geometry.
2. Add a barbell without placing it and confirm it appears in the shopping list and the budget.
3. Add the selection-only accessory and confirm it cannot be placed from either surface.
4. Unplace the bench, confirm it stays in the project, then place it again.
5. Remove an item and confirm the enumerated cascade, then undo.
6. Confirm revision, undo and redo, autosave, exported JSON, and re-import.

### Validation ladder

1. Run the schema, migration, command, store, and analysis suites after each task.
2. Run `npm run quality:quick` after tasks 2, 4, and 6.
3. Run `npm run lint:report` during cleanup.
4. Run `npm run agent:verify` as the exit gate.
5. Run `npm run build` because this phase touches broad client integration and serialized data
   contracts.

## Review gates

- One owner controls the schema, migration, commands, and analysis result contracts.
- A reviewer is required after the migration and after the WebMCP contract change; these are the
  two places where a mistake is either irreversible or externally visible.
- Land the migration and its fixture before any consumer starts reading the new shape.

## Exit gate

Phase 19 is complete when items and placements are independent with strict referential integrity,
cost and coverage derive from items, selection-only products cannot be placed anywhere, the full
migration chain and the representative fixture pass with identical cost, every consumer resolves
products through items, WebMCP exposes the new and changed capabilities through shared commands,
and the canonical validation ladder passes.
