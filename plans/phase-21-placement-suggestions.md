# Phase 21 — WebMCP placement suggestions and batch changes

> Order 2 in the [active queue](README.md). Depends on the completed Phase 17 tool layer and
> Phase 18a walkability work. Blocks Phase 22.

## Problem

The 17 creator tools in `src/features/webmcp/register-room-tools.ts` can only mutate one entity at a
time, and every mutating tool dispatches immediately. An agent that wants to try a layout has to
place equipment, read the resulting validation, and undo — one history entry per step, with a
visibly wrong intermediate state. There is no way to ask "where does this fit", no candidate
generation, no ranking, and no way to apply a coordinated multi-product change as one unit.

The domain layer is already capable of all of this and simply is not exposed:
`applyProjectCommand(project, command, deps)` returns a new project without touching the store, and
`analyzeProject(project, deps)` is pure and deterministically ordered through `compareIssues`.

## Scope

In scope: a pure suggestion module, a pure multi-command apply, one grouped undo entry per batch,
and two new WebMCP tools built on the existing result conventions.

Out of scope: a global layout solver, arbitrary rotation angles, automatic acceptance of
suggestions, changing existing tool signatures, changing global issue severities, and any UI. The
activity feed and the demo script belong to Phase 22.

## Decisions

**D1 — one `changes` array shape, two verbs.** `evaluate_layout_changes` and `apply_layout_changes`
take the same input: an ordered list of existing `ProjectCommand` values. Evaluate returns the
validation the batch would produce and mutates nothing; apply commits it. Reusing one schema keeps
the agent's mental model small and lets a caller evaluate and then apply the identical payload.

**D2 — batches are all-or-nothing.** `applyProjectCommands` folds commands over an in-memory
project and returns a failure carrying the failing index and the original command error if any step
fails. Nothing reaches the store on failure. A partially applied batch would be indistinguishable
from a bug at demo time.

**D3 — a batch is one undo entry.** `dispatchBatch` pushes the pre-batch project onto `past` once
and bumps `revision` once. Without this the agent's "fix the layout" step would need four undos.

**D4 — errors reject, warnings score.** A candidate or batch whose analysis has `errorCount > 0` is
rejected outright and never ranked. Warnings become a deterministic integer penalty, lower is
better, ties broken by candidate order.

**D5 — unreachable is a hard failure inside suggestion scoring, not a global severity change.**
`validateAccess` currently raises `USE_ZONE_UNREACHABLE` and `DOOR_UNREACHABLE` as errors and
`OBSTACLE_UNREACHABLE` as a warning. Suggestion and batch evaluation treat *any* unreachable access
fact as disqualifying, implemented as an explicit rejection rule in the suggestion module. Promoting
`OBSTACLE_UNREACHABLE` to a global error was rejected: it would change existing UI copy, existing
tests and the meaning of `validation.valid` this close to submission, for no judged gain.

**D6 — determinism comes from injected IDs and a fixed scan order.** Candidate generation never
calls `crypto.randomUUID()`. It uses a caller-supplied prefix (`candidate_1`, `candidate_2`, …) and
scans the room on a fixed 10 cm grid in ascending `zCm`, then ascending `xCm`, then rotation
`0, 90, 180, 270`. The same project and the same request must return byte-identical output.

## Implementation tasks

1. **Multi-command apply.** Add `applyProjectCommands(project, commands, deps)` to
   `src/features/project/commands/apply-project-command.ts` or a sibling
   `apply-project-commands.ts`, whichever keeps both files under the line limit. Fold
   `applyProjectCommand` over the accumulating project, merge `affectedEntityIds`, and return either
   a success carrying the final project and one merged analysis, or a failure carrying
   `{ index, commandType, code, message }`. Reject an empty list and cap the batch length (start at
   25) so a runaway agent cannot stall the tab.

2. **Grouped dispatch.** Add `dispatchBatch(commands: unknown): DispatchResult` to
   `ProjectStoreState` in `src/features/creator/store/project-store.ts`, delegating to
   `applyProjectCommands`. One history push, one revision increment, no history push when the batch
   is rejected or produces no change. Keep the existing `dispatch` untouched.

3. **Suggestion module.** New directory `src/features/project/suggestions/`, pure and store-free:

   - `candidate-generation.ts` — `generatePlacementCandidates(project, request, deps)` returns the
     ordered candidate commands for one product or one existing project item, honouring the fixed
     scan order from D6, the requested rotations, and an optional bounding region.
   - `candidate-scoring.ts` — `scoreCandidate(analysis)` returns `{ rejected, reasons, score,
     warningCounts }`. Rejection covers `errorCount > 0` and any unreachable access fact per D5.
     The score is a documented weighted sum over warning codes, defined in one exported constant map
     so the weights are reviewable and testable.
   - `suggest-placements.ts` — `suggestPlacements(project, request, deps)` generates, applies each
     candidate in memory via `applyProjectCommand`, analyses, scores, drops rejected candidates,
     sorts by `(score, candidateIndex)` and returns the top `limit` (default 3, maximum 10) with the
     command needed to realise each one.

   Keep each file well under 500 lines and keep the module free of React, the store and WebMCP types.

4. **New tools.** Add to `src/features/webmcp/`:

   - `suggest_placements` — read-only (`readOnlyHint: true`). Input: product or project item
     reference, optional rotations, optional region, optional limit. Output: ranked candidates, each
     with position, rotation, score, the warnings that produced it, and the exact command to apply.
     Also report how many candidates were generated and how many were rejected, and why, so the
     agent can explain a "nothing fits" answer instead of inventing one.
   - `evaluate_layout_changes` — read-only. Input: the `changes` array. Output: `applies: boolean`,
     the failing index when it does not, and the full `serializeValidation` of the hypothetical
     result plus the delta in error and warning counts against the current state. Must not dispatch.
   - `apply_layout_changes` — mutating. Same input, calls `dispatchBatch`, returns the existing
     mutation envelope (`changed`, `revision`, `affectedEntityIds`, `accessImpact`, `validation`)
     plus a per-change outcome list.

   Put the Zod schemas in `room-tool-schemas.ts` (or a new `batch-tool-schemas.ts` if that file
   approaches the limit) and reuse `createRoomToolError`, `mapRoomToolInputIssues`,
   `serializeMutationBase` and `serializeValidation`. Do not invent a second result convention.

5. **Register and document.** Extend `createRoomWebMcpTools`; the creator set becomes 20 tools.
   Update every test that asserts the count of 17 —
   `register-room-tools.test.ts`, `creator-room-flow.integration.test.tsx` and
   `project-persistence-flow.integration.test.tsx`. Write tool descriptions that state plainly that
   evaluate never mutates, that apply is atomic and undoable as one step, and that a successful
   apply can still leave warnings.

## Acceptance criteria

- `evaluate_layout_changes` leaves `revision`, `project` and `canUndo` unchanged, verified by
  reading state before and after.
- `suggest_placements` returns identical output for identical input across repeated calls and across
  a fresh store built from the same project.
- A product that cannot fit anywhere returns an empty ranked list with a non-empty rejection
  breakdown, not an error.
- A candidate that would block the door or strand an entity never appears in the ranked list.
- A candidate that only produces a use-zone overlap warning appears, ranked below a clean candidate.
- `apply_layout_changes` with four placements produces one undo step that restores the pre-batch
  layout exactly.
- A batch whose third command fails leaves the project untouched and reports index 2.
- Manual UI editing, autosave and the existing 17 tools behave exactly as before.

## Tests

- `src/features/project/commands/apply-project-commands.test.ts` — success fold, mid-batch failure
  with index, empty list, over-limit list, merged `affectedEntityIds`.
- `src/features/creator/store/project-store.test.ts` — extend for `dispatchBatch`: single history
  entry, single revision bump, no history on rejection, undo restores the pre-batch project.
- `src/features/project/suggestions/*.test.ts` — determinism (two identical calls, deep equality),
  scan order, error rejection, unreachable rejection per D5, warning ranking, empty result,
  respecting `limit`.
- `src/features/webmcp/batch-tool-handlers.test.ts` — evaluate does not mutate, apply mutates,
  invalid input maps to `INVALID_INPUT` with issues, domain failure maps to the command error code,
  abort signal handled like the existing handlers.
- `src/features/webmcp/creator-room-flow.integration.test.tsx` — extend the shared-editing flow:
  suggest, evaluate, apply, confirm the UI reflects all placements, then one undo returns to the
  pre-batch layout.

## Manual checks

None required beyond the automated suite; browser verification of the agent loop belongs to
Phase 22, which consumes these tools.

## Exit gate

All acceptance criteria hold and `npm run agent:verify` passes. `npm run build` is not required
unless the change touches routing or component boundaries. Delete this file and its index row
afterwards.
