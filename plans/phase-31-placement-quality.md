# Phase 31 — Placement quality and explainable ranking

> Order 3 in the [active queue](README.md). Start after Phase 30 so ranking can use declared
> furniture clearances instead of inventing generic distances. This is a quality improvement, not
> a substitute for the hard validation completed in Phases 29–30.

## Outcome

Among equally valid candidates, `suggest_placements` should prefer layouts that use the perimeter
sensibly, avoid crowding furniture and preserve a large contiguous training area. The agent must
receive an explainable score breakdown instead of an opaque score whose final tie-break is merely
scan order.

## Scope and ranking policy

- Keep the existing hierarchy: validation errors and unreachable entities reject a candidate;
  warnings remain weighted penalties.
- Add quality metrics only after safety scoring. A soft preference must never make an invalid
  candidate outrank a valid one.
- Use the complete reserved equipment footprint (`useZone`) for space-quality metrics and declared
  furniture functional zones for avoidance. Do not derive furniture behavior from names.
- Add an optional request strategy with a conservative default:
  - `balanced`: preserve open space while using the perimeter when scores are otherwise close;
  - `perimeter`: stronger preference for a valid reserved footprint near a wall/corner;
  - `open-center`: strongest preference for preserving a contiguous central training area.
- Keep `region` as a hard search bound and strategy as a soft ordering preference. Document the
  distinction in the tool schema and description.
- Do not add product-specific placement metadata in the first slice. If fixture evaluation shows
  that benches, racks and compact storage need contradictory defaults, stop at the decision gate
  below and add a small explicit catalog planning preference rather than hard-coded product IDs.

## Work sequence

1. **Create deterministic spatial-quality metrics.** Add a pure suggestion-scoring module that can
   calculate integer perimeter distance, corner affinity and the largest contiguous free/reserved
   grid component after placing a candidate. Reuse existing occupancy/grid primitives where their
   semantics match; do not alter access thresholds to serve ranking.
2. **Define a lexicographic score.** Compare candidates by rejection state, existing warning score,
   strategy-specific spatial-quality tuple, then generation index. Avoid one magic weighted sum
   where a large aesthetic reward can cancel a safety warning. Keep all values deterministic and
   stable across cloned project input.
3. **Return the score breakdown.** Extend ranked candidates with named fields such as warning
   penalty, perimeter distance, corner distance and contiguous-free-area cells. Preserve the
   existing total `score` only if callers need compatibility; document its meaning or deprecate it
   explicitly rather than silently changing units.
4. **Extend the request contract.** Add the optional strategy to the domain request schema,
   WebMCP JSON Schema and tool description. Invalid values must produce structured `INVALID_INPUT`.
   Keep the default deterministic and ensure omitted strategy preserves a documented behavior.
5. **Build fixture benchmarks.** Use small synthetic rooms for exact unit assertions and a
   repository-owned version of the reported furnished room for ordering-level acceptance. Assert
   outcomes (“candidate is on the available perimeter and does not crowd declared furniture”),
   not a fragile full list of every generated index.
6. **Evaluate conflicting equipment shapes.** Compare at least a rack/squat stands, adjustable
   bench, barbell/plate storage and wall-mounted pull-up bar. Confirm the default does not force
   every item into a corner or fragment the room. If one default cannot serve these classes, add an
   optional catalog `planningPreference` enum and test it through the product resolver; do not add
   free-form agent interpretation to the scorer.
7. **Improve agent guidance.** Update `suggest_placements` documentation to tell agents to inspect
   the breakdown, select a strategy from user intent and re-run after each applied candidate.
   Mutation feedback from Phase 29 and `validate_layout` remain the final verification source.
8. **Update architecture and demo guidance.** Record the exact ranking tuple, default strategy and
   limitations. Adjust demo prompts only after live behavior is observed; do not claim global
   optimization because placement remains iterative and one-product-at-a-time.

## Decision gate

After steps 1–5, inspect benchmark output before freezing the default:

- If `balanced` places the rack/stands at a usable perimeter and leaves the bench in an accessible
  area, continue without product metadata.
- If equipment classes need conflicting behavior, add only a constrained enum such as
  `perimeter`, `open-floor` or `storage-edge` to catalog planning data. Define defaults for every
  active and retired product and expose the value in product details.
- Do not tune unexplained weights against one screenshot. Every metric must have a readable reason
  in the candidate result and at least one counterexample test.

## Acceptance criteria

- Two candidates with equal validation results are ordered by the selected spatial strategy before
  `candidateIndex`.
- In the furnished-room fixture, the default no longer selects the first zero-warning coordinate
  beside furniture when an equally safe perimeter/corner candidate preserves more open space.
- `perimeter` and `open-center` produce observably different, deterministic ordering in a fixture
  designed for that distinction.
- Declared furniture functional zones are never violated by an accepted candidate; soft distance
  quality does not replace their hard/warning semantics.
- Every returned candidate includes enough score detail for a tool caller to explain why it ranked
  above the next candidate.
- Existing region, rotation, candidate-count, access-work, locked-item and current-pose behavior
  remains covered. The current pose wins only when it is genuinely tied under the full ranking.
- Repeated runs and structured clones return byte-equivalent ordering and breakdowns.

## Verification checkpoints

1. Run focused spatial-metric and candidate-scoring tests after steps 1–3.
2. Run request-schema, tool-schema and handler tests after step 4.
3. Run synthetic and furnished-room suggestion suites after steps 5–6, recording benchmark time in
   the task/PR rather than creating a permanent report.
4. Manually compare `balanced`, `perimeter` and `open-center` in a disposable project; apply the
   top candidate, re-run suggestions and finish with `validate_layout`.
5. Run `npm run quality:quick` after the coherent slice, `npm run lint:report` during cleanup and
   `npm run agent:verify` before completion. Run `npm run build` for any client/tool-boundary change.

## Risks and guardrails

- Candidate evaluation is already bounded by access work. Reusing a grid per candidate can increase
  runtime materially; cache project-invariant data and keep the existing explicit work limits.
- “Near a wall” and “far from furniture” conflict in furnished rooms. Use lexicographic strategies
  and declared zones, not an undocumented weighted average.
- A largest-free-component metric is an application heuristic, not proof of exercise safety.
- Do not market the iterative scorer as a global room optimizer.

## Exit and documentation cleanup

When ranking is deterministic, explainable and accepted in the representative room, update the
architecture and WebMCP documentation, remove this plan and its queue row, then continue with the
submission plan.
