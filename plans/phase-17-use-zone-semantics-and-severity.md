# Phase 17 — Use-zone semantics and issue severity

## Objective

Replace the overloaded `clearance` concept with explicit `useZone` semantics, and split validation
results into errors and warnings so that a legitimate layout stops being reported as broken.

A use zone is empty space needed to operate equipment, not a forbidden region. A bench standing in
a rack's working area is a trade-off worth reporting, not a physical impossibility. Today every
issue carries `severity: "error"` as a hard-coded literal and `valid` means `issues.length === 0`,
so that trade-off blocks the project.

This phase also introduces `analyzeProject` as the single shared read model that later phases
extend with routes and project items.

## Dependencies

- Phase 12 deterministic equipment placement, validation, store, history, and project-v3
  persistence.
- Phase 13 creator equipment tools and their current shared-editing contract.
- Phase 16 product visual assets, including the `product_summit_strength_station` catalog bundle.

No schema version change and no migration. The project JSON shape is untouched.

## Superseded decision

An earlier draft of this phase proposed a closed `rack-bench-press` station template whose only
purpose was to whitelist the `physical ↔ useZone` relationship for declared member roles. Demoting
that relationship to a warning achieves the same outcome for every product pair, needs no station
entity, no catalog roles, no station commands, and no station tools.

The station template is therefore rejected, not deferred. Products that ship as one physical unit
are modeled as catalog bundles, which already works: `product_summit_strength_station` is a single
`floor` product with one 228 × 174 cm footprint and one price.

## Scope boundary

### Included

- rename the product-level spatial concept from `clearance` to `useZone` across the catalog schema,
  seeds, geometry, validation, WebMCP results, and editor copy;
- add `warning` severity and demote physical-into-foreign-use-zone to a warning;
- add a `USE_ZONE_OVERLAP` warning for two overlapping use zones;
- derive `valid` from error-severity issues only, and expose `errorCount` and `warningCount`;
- introduce `analyzeProject(project, dependencies): ProjectAnalysis` as the shared read model;
- give the plan and validation summary a third visual state for warnings;
- tell agents, in the tool descriptions, that a successful mutation can still leave issues;
- split `validate-project.ts`, which is at 422 of the permitted 500 physical lines.

### Excluded

- station templates, product roles, or any user-controlled overlap exception;
- project items, placement modes, or any project schema version change (Phase 19);
- access requirements and route analysis (Phase 18);
- polygon use zones, exercise-specific zone shapes, or open-frame rack geometry;
- changing which relationships are checked, beyond the severities listed below;
- placement suggestions or batch layout changes.

## Accepted domain decisions

### 1. Physical footprints and use zones remain different concepts

`physical` is the floor area occupied by the placed object. `useZone` is additional empty space
needed to operate or access it. The MVP keeps the existing asymmetric front/back/left/right margin
representation and rectangular AABB calculations.

| Relationship | Severity | Change |
|---|---|---|
| physical ↔ physical | error | unchanged |
| physical ↔ physical obstacle | error | unchanged |
| physical ↔ unavailable zone | error | unchanged |
| physical or use zone ↔ room bounds | error | unchanged |
| use zone ↔ physical obstacle or unavailable zone | error | unchanged |
| ceiling height, budget, wall bounds, wall overlap | error | unchanged |
| **physical ↔ use zone of another item** | **warning** | **was error** |
| **use zone ↔ use zone** | **warning** | **new check** |

Walls, columns, and unavailable zones do not negotiate, so a use zone leaving the room or hitting
an obstacle stays an error. Only equipment-to-equipment zone sharing becomes advisory.

### 2. `valid` means "no errors"

An analysis is valid when it contains no `severity: "error"` issue. Warnings remain fully
structured, sorted, and visible, but do not invalidate the project. This is a breaking change for
any consumer that infers validity from `issueCount === 0`.

### 3. Analysis becomes the shared read model

```ts
type ProjectAnalysis = {
  issues: readonly ValidationIssue[]; // stable sort, unchanged ordering rule
  valid: boolean;                     // no error-severity issue
  errorCount: number;
  warningCount: number;
};
```

`analyzeProject` is pure and free of React, Zustand, and Three.js. Phase 18 adds `routes` and
Phase 19 adds resolved item facts to this same type. Keep `validateProject` as a thin compatibility
wrapper only if that avoids a broad one-step rewrite inside this phase.

### 4. A successful mutation may leave the project invalid

This is existing behavior and it stays. `applyPlacementCommand` checks product existence, ID
collision, and schema only; geometry never blocks a command. Validation runs after the mutation in
`success()` and travels back in the result. Manual dragging behaves the same way, and the shared
invariant requires that the agent and the user follow identical rules.

The gap is presentation, not policy: `ok: true` reads as unqualified success, and after this phase
a warning-only layout also reports `valid: true`. The tool descriptions must close that gap.

## Implementation tasks

### 1. Rename `clearance` to `useZone`

1. Rename the catalog `clearance` field and its schema in `src/features/catalog/schemas/product.ts`
   and every seed file under `src/data/products/`.
2. Rename `ProductClearance`, `ProductGeometryDescriptor.clearance`, and
   `EquipmentFootprints.clearance` in `src/features/geometry/equipment-footprints.ts`, including
   `getRotatedClearanceInsets`.
3. Rename issue codes `CLEARANCE_CONFLICT` → `USE_ZONE_OVERLAP` and `CLEARANCE_OUTSIDE_ROOM` →
   `USE_ZONE_OUTSIDE_ROOM`, plus the matching `issueCounts` keys in `serializeValidation`.
4. Update editor copy in `describeValidationIssue`, catalog product details, and the CSS class
   names derived from issue codes.

Checkpoint: no non-test source file mentions `clearance`; rotation behavior and computed rectangles
are byte-identical to before the rename.

### 2. Introduce severity and the new relationship severities

1. Widen `severity` in `validation-issues.ts` from the `"error"` literal to `"error" | "warning"`
   on the issue types that can now be advisory.
2. Set `USE_ZONE_OVERLAP` (physical entering a foreign use zone) to `warning`.
3. Add the use-zone ↔ use-zone pair check as a `warning`, reusing the existing deterministic pair
   iteration and `entityIds` sorting.
4. Leave every relationship in the table above that is marked unchanged as `error`, especially
   `USE_ZONE_OUTSIDE_ROOM` and use-zone-versus-obstacle conflicts.

Checkpoint: a rack and a bench placed side by side produce exactly one warning and no error; a rack
overlapping a bench physically still produces an error.

### 3. Introduce `analyzeProject` and split the validation module

1. Add `analyzeProject` returning `ProjectAnalysis` and migrate the store, commands, persistence
   checks, summaries, and WebMCP to it.
2. Change `ProjectStoreState.validation` to carry the analysis rather than a bare issue array, and
   update `dispatch`, `replaceProject`, `undo`, and `redo` consistently.
3. Split `validate-project.ts` before it grows further. Suggested boundary: bounds rules, pair
   collision rules, use-zone rules, and requirement/budget rules as separate modules behind
   `analyzeProject`.

Checkpoint: `analyzeProject` is pure, deterministic, and repeated calls on the same project return
equivalent structured data; no source file exceeds 500 physical lines.

### 4. Present warnings distinctly in the editor

1. Give `ValidationSummary` separate error and warning groups, with a heading that states both
   counts and a message that distinguishes "no conflicts" from "no errors, N warnings".
2. Make `hasIssue` in `room-plan-entities.tsx` severity-aware and add an `is-warned` state next to
   the existing `is-invalid`, with a distinct non-red treatment in `globals.css`.
3. Update the accessible labels so a warned entity does not announce itself as having an error.

Checkpoint: a warning is visible in the plan and the summary without the red error treatment, and
the summary never claims a clean layout while warnings exist.

### 5. Make the agent contract explicit

1. Raise `errorCount` and `warningCount` to the same level as `valid` in `serializeValidation`, and
   derive `valid` from error-severity issues only.
2. Add one sentence to the `place_product`, `update_placement`, `add_obstacle`, `update_obstacle`,
   and `configure_room` descriptions in `register-room-tools.ts`: the call succeeds even when the
   resulting layout is invalid, and the caller must read `validation.valid`,
   `validation.errorCount`, and `validation.warningCount` and report them to the user.
3. Extend the `validate_layout` description with the error-versus-warning distinction.
4. Update `docs/AGENT_HOME_GYM_WORKFLOW_PROMPT.md` with the same distinction.

Checkpoint: the serialized result surfaces warnings without requiring the caller to scan `issues`,
and no tool description implies that success means a valid layout.

## Acceptance criteria

- No non-test source or configuration file refers to product `clearance`.
- Rotated use-zone rectangles are identical to the pre-rename clearance rectangles at 0, 90, 180,
  and 270 degrees.
- A physical footprint entering another item's use zone produces exactly one `USE_ZONE_OVERLAP`
  warning and does not invalidate the project.
- Two overlapping use zones produce a deterministic warning.
- A use zone leaving the room or entering an obstacle or unavailable zone remains an error.
- Physical collisions, ceiling height, budget, wall bounds, and wall overlap remain errors.
- A project containing only warnings reports `valid: true` with `warningCount > 0`.
- `analyzeProject` is pure, deterministic, and shared by UI, commands, persistence, and WebMCP.
- Editor and WebMCP present errors and warnings distinctly.
- Tool descriptions state that a successful mutation may leave issues.
- No source or configuration file exceeds 500 physical lines.

## Tests and verification

### Narrow automated checks

1. Product schema and catalog seed tests for the renamed `useZone` field.
2. Geometry tests proving renamed inset rotation produces unchanged rectangles at all four
   rotations, including asymmetric margins and edge touching.
3. Validation tests for the complete relationship table, both severities, stable sorting, and the
   new use-zone ↔ use-zone pair check.
4. `analyzeProject` tests for `valid`, `errorCount`, `warningCount`, purity, and determinism.
5. Store tests for analysis after dispatch, replace, undo, and redo.
6. Component tests for the separated error and warning presentation, the `is-warned` plan state,
   and accessible labels.
7. WebMCP tests for the renamed issue codes, `issueCounts` keys, error-only `valid`, and the
   warning counts.

### Manual scenario

1. Place the Summit Power Cage, then place the Arc Adjustable Bench inside its 80 cm front zone.
2. Confirm one warning, no error, a non-red plan treatment, and `valid: true` in `validate_layout`.
3. Drag the bench until the physical rectangles overlap and confirm a hard error.
4. Place the `product_summit_strength_station` bundle and confirm it behaves as one unit.
5. Ask the agent to place equipment into a conflict and confirm it reports the warning or error
   from the tool result instead of declaring success.

### Validation ladder

1. Run the geometry, validation, store, and WebMCP suites after each task.
2. Run `npm run quality:quick` after tasks 3 and 5.
3. Run `npm run lint:report` during cleanup and confirm the validation module split.
4. Run `npm run agent:verify` as the exit gate. `npm run build` is not required; this phase touches
   no routing, Server/Client boundary, or Next.js configuration.

## Exit gate

Phase 17 is complete when the rename is total, the severity table is implemented and tested,
`valid` derives from errors alone, `analyzeProject` is the single shared read model, the editor and
WebMCP present warnings distinctly, tool descriptions state the post-mutation validation contract,
and the canonical validation ladder passes with no file over 500 lines.
