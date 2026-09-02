# Phase 30 — Furniture functional clearance

> Order 2 in the [active queue](README.md). Start only after Phase 29 has made the existing
> equipment use-zone behavior correct. This phase changes the persisted project format and must
> not be folded into the smaller wall-placement fix.

## Outcome

Physical obstacles can declare directional functional clearance so the planner can represent the
space required to open a wardrobe, use a desk, move a chair, approach storage or access the side
of a bed. Validation, suggestions, UI and WebMCP must all use the same rotated clearance geometry.

This replaces unreliable name-based guesses and a universal furniture buffer. An obstacle with
zero functional margins behaves exactly as it does today; the app must not claim that unconfigured
furniture access has been checked.

## Domain contract

- Add a required `functionalClearance` object to physical obstacles with non-negative integer
  `frontCm`, `backCm`, `leftCm` and `rightCm`. Keep unavailable zones unchanged.
- Increment the project version and migrate older physical obstacles to four zero margins. Preserve
  every existing ID, pose, dimension and lock state. The migration is format normalization, not an
  invented claim that old furniture needs no access.
- Rotate functional margins with the obstacle using the same directional convention as equipment
  use zones. Extract or reuse a shared pure helper so equipment and obstacle direction mapping
  cannot drift.
- Add `FUNCTIONAL_ZONE_OVERLAP` as a structured validation issue with `zoneOwnerId`, `blockingEntityId`
  and exact overlap bounds.
- A physical equipment footprint entering declared furniture clearance is an error. Equipment
  use-zone versus furniture clearance is a warning because the activities may be time-separated.
  Physical obstacle versus another obstacle's functional clearance is a warning. A physical
  collision remains the stronger existing error and suppresses a duplicate functional-zone issue.
- Functional clearance is a reserved operating target, not a physical walking blocker. It may be
  walked through, but access validation must verify that at least part of the declared zone is
  reachable from a door.

## Work sequence

1. **Version and schema.** Add the clearance-margin schema beside the project geometry schemas,
   extend only `physicalObstacleSchema`, increment `PROJECT_VERSION`, and implement the previous-to-
   current migration in `project-migrations.ts`. Update current/demo fixtures through the codec;
   never hand-edit historical fixtures into pretending they were authored in the new version.
2. **Commands and serialization.** Extend obstacle add/update command payloads, immutable update
   behavior and JSON import/export. A locked obstacle must retain the existing rule that only an
   exact unlock patch is accepted. Ensure zero-valued patches and partial clearance updates have an
   unambiguous runtime schema.
3. **Geometry model.** Change `collectObstacles` to retain both physical and functional footprints.
   Add focused rotation tests and edge-touch tests. Keep height only on the physical obstacle;
   functional clearance is intentionally a floor-plane convention.
4. **Validation.** Add a dedicated validator or a clearly separated section in use-zone validation.
   Produce one strongest issue per entity pair and keep issue ordering deterministic. Include the
   new code in descriptions, counts, room-plan highlights, summary and WebMCP serialization.
5. **Access.** Make a non-zero functional zone the obstacle's access target. Zero-clearance legacy
   obstacles retain the current expanded-footprint target. Confirm functional zones do not become
   occupancy blockers and do not create false disconnected rooms.
6. **Manual editor.** Add directional clearance inputs to `obstacle-form.tsx`, grouped under a plain
   explanation such as “Space needed to use this furniture.” Show the rotated zone in 2D and 3D
   when the obstacle is selected or use zones are enabled. Preserve keyboard editing, draft
   behavior, lock handling and one-command undo.
7. **WebMCP contract.** Add the same fields to `add_obstacle`, allow partial updates through
   `update_obstacle`, and describe that agents must use measurements supplied by the user rather
   than infer clearance from an obstacle name. Return canonical rotated state and the validation
   feedback established in Phase 29.
8. **Representative room data.** Add a repository test fixture based on the reported room with
   explicit, reviewable margins for at least the wardrobe and desk/chair area. Do not silently
   change the user's imported project; demonstrate the intended corrected model through a test or
   disposable fixture.
9. **Documentation.** Update product concept, architecture, editor behavior and JSON format notes.
   State that clearances are user/agent-provided planning constraints, not building regulations.

## Acceptance criteria

- Every project version supported before this phase migrates to the new version and round-trips
  without losing state; old physical obstacles receive four zero margins.
- Add, update, lock/unlock, undo/redo, import/export and project replacement preserve functional
  clearance through both UI and WebMCP paths.
- All four rotations produce the correct directional footprint and exact overlap details.
- Equipment physically blocking declared wardrobe clearance produces an error and is rejected by
  `suggest_placements`; use-zone-only overlap produces a warning and a ranking penalty.
- Declared furniture clearance that cannot be approached produces the appropriate access issue,
  while the same geometry remains walkable.
- Unavailable zones and zero-clearance physical obstacles retain their existing behavior.
- The editor and tool result name the relevant furniture and equipment; the issue is visible in
  2D, 3D, Layout checks and `validate_layout`.
- No validation uses obstacle names, guessed furniture types or external safety claims.

## Verification checkpoints

1. Run project-schema, command and migration tests after steps 1–2, including all historical
   fixture versions and a canonical export round-trip.
2. Run geometry, project-validation and access tests after steps 3–5.
3. Run obstacle form, room-plan, scene-transform and store integration tests after step 6.
4. Run room-tool schema/handler and shared creator-flow tests after step 7.
5. Manually import an old project, add a 60 cm front wardrobe zone, place/move equipment across its
   boundary, inspect both views, undo/redo and export/re-import.
6. Run `npm run quality:quick`, `npm run lint:report`, `npm run agent:verify` and `npm run build`.

## Risks and guardrails

- The schema change touches persistence, commands, UI and tools. Land it as one coherent versioned
  slice; do not allow one adapter to manufacture defaults independently.
- Direction labels can become confusing after rotation. Reuse the equipment convention and show
  the orientation in the editor instead of creating furniture-specific axes.
- Functional-zone versus access semantics can accidentally make a reserved area a wall. Tests must
  prove it is an access target but not an occupancy blocker.
- Avoid a generic minimum buffer. A zero configuration means “not specified,” not “certified safe.”

## Exit and documentation cleanup

When the migrated schema and shared-editing flow pass, document the new current version and
functional-zone semantics, remove this plan and its queue row, and proceed to Phase 31.
