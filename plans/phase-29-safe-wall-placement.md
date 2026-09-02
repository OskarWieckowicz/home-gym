# Phase 29 — Safe wall-mounted placement

> Order 1 in the [active queue](README.md). This is the release-blocking correctness slice.
> It fixes the supplied pull-up-bar case without introducing full 3D collision volumes or
> changing the persisted project schema.

## Outcome

Wall-mounted equipment must not receive a safe, zero-warning suggestion when its operational
margin is blocked by furniture. Placement suggestions must also cover all four walls even when
the exact flush coordinate is not divisible by the 10 cm search grid. A WebMCP mutation must make
the resulting validation codes visible without requiring the agent to infer their existence from
counts alone.

The supplied `home-gym-project-v4 (3).json` is the primary regression case. Its Anchor Pull-Up Bar
at `x=0, z=140, rotation=270` overlaps the low bed and TV console in horizontal projection. Their
heights do not reach the bar mounted from 195 cm, so this is not a physical collision; both objects
extend into the bar's operational use-zone margins and must therefore invalidate that placement.

## Scope and decisions

- Preserve the existing 2.5D model: physical footprints remain X/Z rectangles, with wall-mount
  height used to distinguish a real physical collision from a low object below a mount.
- Preserve the intentional case where a low object lies entirely below the wall-side physical
  projection and does not enter an operational margin. Do not turn every wall mount into a
  floor-blocking object and do not set `blocksFloor` on the pull-up bar.
- Treat an obstacle entering a wall-mounted equipment use-zone margin as `USE_ZONE_OVERLAP` with
  severity `error`; retain the current warning policy for equipment versus equipment.
- Do not add a generic legal or exercise-safety distance. The use-zone dimensions remain catalog
  planning data and application conventions.
- Keep the 10 cm grid along a wall, but snap the perpendicular coordinate exactly to the wall.
  For example, the 54 cm rotated depth in a 400 × 600 cm room must generate `x=346` for the right
  wall and `z=546` for the bottom wall.
- Keep single mutations committable even when invalid. Improve their feedback rather than creating
  a WebMCP-only rejection path. `suggest_placements` continues to reject error-producing candidates.

## Work sequence

1. **Represent use-zone margins explicitly in geometry.** Add a pure helper near
   `src/features/geometry/equipment-footprints.ts` that returns the non-overlapping rectangles in
   `useZone - physical`. Exclude zero-area strips and preserve exact edge-touch semantics. Cover
   unrotated and rotated footprints without embedding mounting or product policy in the helper.
2. **Fix mounted use-zone validation.** Refactor
   `src/features/project/validation/validate-use-zones.ts` so a 2D physical intersection does not
   automatically suppress every use-zone check. For floor equipment, floor-blocking mounts and
   actual height-reaching collisions, continue avoiding duplicate issues. For a non-floor-blocking
   wall mount above a low blocker, test the operational margin rectangles and report the existing
   structured issue when a margin is blocked.
3. **Add the supplied-layout regression.** Create a small repository fixture derived from the
   supplied geometry, or construct the exact relevant entities in the validation test; do not
   depend on a file in `Downloads`. Assert errors for both the bed and TV console, zero false
   `PHYSICAL_COLLISION` reports for those pairs, and stable entity IDs/details.
4. **Correct wall candidate generation.** Split candidate generation into floor-grid and
   wall-mounted paths in `src/features/project/suggestions/candidate-generation.ts`. Resolve the
   product before generation, use its rotated footprint, generate only the rotation's mounting wall,
   and set the perpendicular coordinate exactly. Apply optional `region` bounds to the final exact
   footprint rather than rounding the wall snap back onto the origin grid.
5. **Retain deterministic bounds and limits.** Deduplicate candidates at wall/corner boundaries,
   preserve stable `candidateIndex`, and calculate the candidate/search-work limits from the actual
   generated positions. A narrow region that excludes the exact wall footprint must return no
   candidate rather than silently escaping the region.
6. **Expose actionable mutation feedback.** Extend `serializeValidationSummary` in
   `src/features/webmcp/room-tool-results.ts` with sorted unique error/warning code arrays and
   structured issues involving the mutation's affected entity IDs. Update the shared room and
   placement handler helpers instead of duplicating filtering across every tool. Keep
   `validate_layout` as the complete, read-only source for all issues.
7. **Update tool descriptions and durable contracts.** Amend `register-room-tools.ts` to say that
   wall suggestions snap exactly to all four walls and mutation results include affected issue
   details. Update `docs/TECHNICAL_ARCHITECTURE.md` with the mounted-margin rule and wall-candidate
   generation behavior. Update `docs/PRODUCT_CONCEPT.md` only if its description would otherwise
   imply a different clearance policy.

## Acceptance criteria

- The supplied pull-up-bar pose produces at least the two expected obstacle-owned
  `USE_ZONE_OVERLAP` errors and is no longer `valid`.
- A low blocker wholly below the permitted wall-side physical projection remains silent; moving it
  1–2 cm into an operational margin produces an issue.
- A blocker taller than `bottomHeightCm` continues to produce `PHYSICAL_COLLISION` without a
  duplicate use-zone issue.
- The mounted behavior is covered for rotations 0, 90, 180 and 270 and for both obstacles and
  equipment blockers.
- Suggestions reject the supplied left-wall pose and generate exact right/bottom wall candidates
  containing `x=346` and `z=546` where the region permits them.
- The same exact poses pass through `place_product`, `place_project_item` and `update_placement`;
  UI and WebMCP still use the same domain validation.
- A mutation response contains the relevant error code and affected entity IDs; a subsequent
  `validate_layout` returns the same issue, not a divergent adapter-only result.
- Existing floor placement order and current-pose no-op behavior remain deterministic.

## Verification checkpoints

1. Run focused geometry and validation tests for `equipment-footprints` and
   `validate-mounting`/`validate-project` after steps 1–3.
2. Run focused candidate-generation and `suggest-placements` tests after steps 4–5.
3. Run focused WebMCP handler, schema and creator-room-flow tests after step 6.
4. Import a repository-owned copy of the regression fixture in the creator, confirm the Layout
   checks panel names the bar and blockers, and ask a connected agent for suggestions on all walls.
5. Run `npm run quality:quick`, then `npm run lint:report` during cleanup.
6. Run `npm run agent:verify` before completing the phase. Run `npm run build` if the implementation
   changes client boundaries, tool registration behavior or other deployment-sensitive code.

## Risks and guardrails

- Rectangle subtraction can create duplicate or zero-area margin pieces; centralize it in a tested
  geometry helper rather than open-coding it in validation.
- Wall candidates can exceed the existing search-work assumptions if generated in addition to the
  full floor grid. Wall-mounted products should use the wall path instead of receiving both paths.
- Adding full issues to every mutation can create noisy tool payloads. Limit inline details to
  affected entities while always returning complete code summaries and preserving `validate_layout`.
- Do not weaken the existing collision, access or candidate-rejection checks to make new wall
  candidates appear.

## Exit and documentation cleanup

When all acceptance criteria pass, transfer the mounted-margin and exact-wall-snap contracts into
the architecture documentation, remove this plan and its queue row, and make Phase 30 the active
implementation outcome.
