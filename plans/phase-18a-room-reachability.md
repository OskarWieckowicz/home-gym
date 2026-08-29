# Phase 18a — Room reachability and the agent access contract

## Objective

Prove after every change, without anyone asking for it, that the room can still be walked through:
that its doors reach each other and that a person can stand where equipment is meant to be used.

The failure this prevents is specific. A person editing the plan sees at a glance whether the room
is still passable. An agent driving the same project through WebMCP sees no plan at all, so it can
fill the room with equipment until nothing can be reached, and then report success because every
individual tool call succeeded. Reachability closes that gap by turning passability into a derived
fact that travels with every result, exactly as collision detection already does.

## Dependencies

- Phase 17 use-zone semantics, `error`/`warning` severity, and `analyzeProject` as the shared read
  model. All three are implemented: `ProjectStoreState.validation` already carries
  `ProjectAnalysis`, and tool descriptions already carry the post-mutation validation note.
- Existing rectangular-room, integer-centimetre, and 90-degree-rotation geometry invariants.
- Existing wall elements, which already model doors with a wall, an offset, and a width.

This phase does not depend on Phase 18b or Phase 19, and it does not change the project schema,
the project version, persistence, import, or export.

## Scope boundary

### Included

- a deterministic occupancy grid, clearance map, and connected-component labelling in
  `src/features/geometry/`;
- reachability facts derived from doors and attached to `ProjectAnalysis`;
- new issue codes with the severities in the table below;
- an explicit "access cannot be evaluated" state when the project has no door;
- an access-impact difference on `CommandSuccess` that names what a single change broke or restored;
- serialization of both into `get_project_state`, `validate_layout`, and every mutation result;
- tool-description and workflow-prompt changes so the agent cannot read a blocked room as a
  legitimate trade-off;
- editor presentation of the new issues through the existing error and warning surfaces.

### Excluded

- named access requirements, derived polylines, A\* routing, route overlays, and footprint
  visualisation, which are Phase 18b;
- the `check_access` question tool, which is Phase 18b;
- hypothetical "what if I place it here" evaluation, which belongs with placement candidates in
  Phase 21;
- door swing arcs, hinge direction, and automatically generated unavailable zones;
- navigation meshes, irregular rooms, and arbitrary rotation angles;
- any command that blocks, relocates, or refuses a placement because of access;
- project schema changes, a new project version, or new persisted fields;
- building-code or accessibility certification claims.

## Accepted domain decisions

### 1. Reachability is a derived fact, computed unconditionally

There is no path entity, no stored corridor, and no user or agent action that enables the check. The
analysis recomputes it from current geometry on every call, in the same class as
`PHYSICAL_COLLISION` and `OUTSIDE_ROOM`. This is deliberate: a safety net that only arms itself when
someone remembers to arm it does not protect against forgetting.

The agent is never told what to do about the result. It receives a fact and interprets it, which
keeps the split required by the repository invariants — deterministic geometry in the engine,
interpretation in the agent.

### 2. Two constants, not a project setting

```ts
const PASSABLE_WIDTH_CM = 55; // below this, a person does not get through
const COMFORT_WIDTH_CM = 75;  // above this, the passage is not reported as tight
const REACH_CM = 30;          // how close a person must stand to count as reaching a target
```

They are application conventions chosen so that a small room is not permanently invalid. They are
not legal, professional, or accessibility standards, and no copy may present them as such. Keeping
them as constants is what allows this phase to touch no schema, no migration, and no export.

Because the user cannot tune the thresholds, the analysis must report three states rather than a
boolean: reachable comfortably, reachable but tight, or unreachable. The two states are produced by
running the same labelling twice, once per threshold. An exact narrowest-point measurement needs a
concrete route and therefore belongs to Phase 18b.

### 3. Unreachable is an error; tight is a warning

`docs/AGENT_HOME_GYM_WORKFLOW_PROMPT.md` currently instructs the agent that warnings mean a
legitimate trade-off that must not be treated as a broken layout. Reporting an unwalkable room at
warning severity would therefore be actively harmful: the agent would be following instructions when
it ignored the signal. Equipment that cannot be reached is not a trade-off, it is a defect.

| Condition | Code | Severity |
|---|---|---|
| A door is physically covered, so it seeds nothing | `DOOR_BLOCKED` | error |
| Two doors are not connected to each other | `DOOR_UNREACHABLE` | error |
| A placement's use zone contains no reachable standing space | `USE_ZONE_UNREACHABLE` | error |
| A physical obstacle cannot be approached | `OBSTACLE_UNREACHABLE` | warning |
| A reachable target is only reachable below the comfort width | `ACCESS_TIGHT` | warning |
| The project has no door, so access cannot be evaluated | `ACCESS_NOT_EVALUATED` | warning |

A physical obstacle stays advisory because obstacles legitimately include columns, radiators, and
niches that nobody needs to approach, and placing a rack tightly against a column is a normal
layout, not an error. Unavailable zones are not access targets at all.

`ACCESS_NOT_EVALUATED` is a warning only because the severity vocabulary has two values. Its copy
must read as missing input rather than as an accepted trade-off, in both the editor and the tool
result.

### 4. Doors seed the search and are exempt from the width threshold

The check judges what equipment does to the room, not what the building is. A 70 cm door is a fact
of the flat, so door seed cells are exempt from the clearance threshold and count as blocked only
when something physically covers them. Propagation away from the seeds obeys the threshold normally.
Judging a door opening against a required width is Phase 18b's job, where the user states that width
explicitly.

### 5. Target definitions are fixed and deterministic

- **Door** — the grid cells immediately inside its wall opening.
- **Placement with declared use-zone margins** — the cells inside its use-zone rectangle. A use zone
  is by definition the space a person must occupy to operate the equipment, so if no reachable cell
  lies inside it, the equipment cannot be used.
- **Placement without margins** — the cells within `REACH_CM` of its physical rectangle, because
  products such as plates declare no use zone and would otherwise be unreachable by construction.
- **Physical obstacle** — the cells within `REACH_CM` of its rectangle.
- **Unavailable zone** — not a target.

A target is reachable when at least one of its cells belongs to a labelled component that contains
at least one door seed.

## Implementation tasks

### 1. Build the pure occupancy and reachability geometry

1. Add `occupancy-grid.ts` in `src/features/geometry/`: a 10 cm grid matching the editor's existing
   snap, indexed row-major by z then x, with room dimensions rounded up and any partial boundary
   cell marked blocked.
2. Mark as blocked: cells outside the room, equipment physical footprints, physical obstacles, and
   unavailable zones. Use zones stay traversable, since they are empty operating space.
3. Add `clearance-map.ts`: a deterministic integer distance transform from blocked cells. A two-pass
   chamfer with 3/4 weights is the default choice; whatever is used must be documented as an
   approximation of Euclidean distance and covered by tests.
4. Add `reachability.ts`: threshold the clearance map at half the requested width, label connected
   components in scan order, and expose component lookup by cell.
5. Add `access-targets.ts` implementing decision 5, and `access-facts.ts` producing one fact per
   target with state `comfortable`, `tight`, or `unreachable`.

Import no React, Zustand, or Three.js in any of these modules. Keep each well under the 500-line
limit; five small modules is the intended shape, not an accident.

Checkpoint: the same project produces identical facts on repeated calls, moving one blocker changes
them predictably, and a 400 × 400 room with ten placements is fast enough to run on every pointer
move.

### 2. Integrate the facts into the shared analysis

1. Extend `ProjectAnalysis` in `project-analysis.ts` with the resolved access facts and an explicit
   `evaluated` flag carrying the reason when it is false.
2. Add `validate-access.ts` next to the existing rule modules and call it from `analyzeProject`,
   preserving the existing `compareIssues` ordering.
3. Add the six codes from decision 3 to `VALIDATION_ISSUE_CODES` and their issue types to
   `validation-issues.ts`, keeping `entityIds` sorted for pair issues.
4. Skip every target check when there is no door and emit `ACCESS_NOT_EVALUATED` exactly once.

Checkpoint: a bench walled in behind a rack makes the project invalid; a rack pushed against a
column produces a warning and leaves it valid; a project without doors produces exactly one
`ACCESS_NOT_EVALUATED` and no target issues.

### 3. Report what a single change broke

1. Extend `CommandSuccess` in `command-results.ts` with an access impact listing the entities this
   change made unreachable and those it restored, each with its reason.
2. Compute it in `success()` in `apply-project-command.ts`, which already receives both
   `previousProject` and `project`. An unchanged command reports an empty impact.
3. Leave `undo`, `redo`, and `replaceProject` reporting analysis only. They restore a whole state,
   so a per-change difference would be misleading there.

This is the signal an agent actually acts on: a static list tells it something is wrong somewhere,
while a difference names the item it just placed.

Checkpoint: placing equipment across the only corridor returns `ok: true` with the blocked entities
named in the impact; removing it returns them as restored; a no-op command returns an empty impact.

### 4. Make the contract explicit for agents

1. Extend `serializeValidation` in `room-tool-results.ts` with the access block and matching
   `issueCounts` keys, and serialize the access impact in mutation results as detached data.
2. Add one access note to the shared description constants in `register-room-tools.ts` stating that
   results carry reachability facts and that unreachable entities are errors, not trade-offs.
3. Extend the `validate_layout` description with the reachable, tight, and unreachable distinction
   and with the no-door state.
4. Update `docs/AGENT_HOME_GYM_WORKFLOW_PROMPT.md`: require doors in stage 2 before equipment is
   placed rather than only "when their positions can be estimated reasonably", and rewrite the
   warning guidance in stage 5 so that unreachable entities are excluded from the trade-off rule and
   an access impact must be resolved before continuing.

Checkpoint: an agent that never calls a new tool still receives access facts in every result, and no
description or prompt sentence permits it to treat an unwalkable room as acceptable.

### 5. Present access in the editor

1. Add copy for the six codes to the existing issue description helper and map them in
   `entity-issue-state.ts` so an unreachable placement takes the invalid state and a tight or
   unapproachable one takes the warned state.
2. Ensure `ValidationSummary` states the no-door case as missing input rather than as a warning
   about the layout.
3. Optionally tint the unreachable floor area in the plan. This is the one cuttable item in the
   phase; the entity states and the summary are not.

Checkpoint: walling in a bench marks it invalid in the plan and names the reason in the summary, and
accessible labels do not announce a warned entity as an error.

## Acceptance criteria

- Reachability is computed without any tool call, entity, setting, or user action.
- A room whose only corridor is blocked by equipment reports an error and becomes invalid.
- A placement whose use zone contains no reachable standing space reports `USE_ZONE_UNREACHABLE`.
- A product that declares no use-zone margins is never reported unreachable merely for that reason.
- An unapproachable physical obstacle reports a warning and leaves the project valid.
- A project without doors reports exactly one `ACCESS_NOT_EVALUATED` and no target issues.
- A door narrower than `PASSABLE_WIDTH_CM` does not by itself produce an issue.
- A door covered by equipment reports `DOOR_BLOCKED`.
- A successful mutation names the entities it made unreachable and those it restored.
- Repeated analysis of an unchanged project returns equivalent structured access data.
- The project schema, project version, persistence, import, and export are untouched.
- UI and WebMCP read the same facts from the same analysis.
- No source or configuration file exceeds 500 physical lines.

## Tests and verification

### Narrow automated checks

1. Grid tests for rounding, partial boundary cells, blocker marking, and traversable use zones.
2. Clearance-map tests for the documented approximation, symmetry, and integer arithmetic.
3. Component-labelling tests for scan-order determinism and for two rooms separated by equipment.
4. Target tests for all four target kinds, all four rotations, zero-margin products, and doors on
   each of the four walls.
5. Analysis tests for every row of the severity table, the no-door case, stable ordering alongside
   existing issues, purity, and determinism.
6. Command tests for the access impact on break, restore, no-op, and failure, and for undo and redo
   reporting analysis without an impact.
7. WebMCP tests for the serialized access block, the `issueCounts` keys, detached results, and the
   error-only `valid` derivation.
8. Component tests for the new entity states, the summary copy, and the no-door message.

### Manual scenario

1. Create a room with an entrance door and a balcony door and confirm access is evaluated.
2. Place equipment across the corridor between them and confirm the error, the invalid project, and
   the named access impact.
3. Move the equipment aside and confirm the restored impact.
4. Wall a bench in behind a rack and confirm `USE_ZONE_UNREACHABLE` on the bench alone.
5. Remove both doors and confirm the evaluation stops with a single explicit message.
6. Ask an agent to fill the room with equipment and confirm it reports the blockage from the tool
   result rather than declaring success.

### Validation ladder

1. Run the geometry, validation, command, and WebMCP suites after each task.
2. Run `npm run quality:quick` after tasks 2 and 4.
3. Run `npm run lint:report` during cleanup; the geometry modules are where the 500-line limit is
   most likely to bite, so keep the five-module split from the start.
4. Run `npm run agent:verify` as the exit gate. `npm run build` is not required: this phase changes
   no routing, no Server/Client boundary, and no Next.js configuration.

## Exit gate

Phase 18a is complete when reachability is derived unconditionally from current geometry, the
severity table is implemented and tested, the no-door state is explicit, every mutation reports what
it broke or restored, the agent contract and workflow prompt exclude unreachable entities from the
trade-off rule, the editor presents the new issues through its existing surfaces, and the canonical
validation ladder passes with no file over 500 lines.

## Cut line

This phase is the safety net, so it is not the cut line; Phase 18b is. If time inside this phase
runs short, the cuttable items in order are the floor tint, the `ACCESS_TIGHT` comfort tier, and the
`OBSTACLE_UNREACHABLE` warning. Door connectivity, use-zone reachability, the access impact, and the
agent contract are the phase; shipping without them leaves the original problem untouched.
