# Phase 20 — 3D room preview completion

> Order 4 in the [active queue](README.md). Depends on the completed Phases 15–17 and 19, and reads
> the asset registry Phase 16 owns. Nothing depends on this phase, so it is the first candidate for
> narrowing if the schedule tightens.

## Implementation status — 30 August 2026

- Tasks 1–3 and 5 implemented: selection and validation are props, issue presentation reuses the
  2D helper, selection uses an independent envelope outline, and only placed products are preloaded.
  Entity rendering and the per-placement error boundary are extracted into sibling scene files.
- Task 4 explicitly cut: the scene remains one-way selection sync from the plan/list. No `onSelect`
  prop or pointer handler was added, so orbiting cannot accidentally select or mutate an entity.
- Automated coverage includes the appearance policy, preload scope, editor props after plan/list
  selection and inspector edits/undo, unchanged scene transforms, and isolated asset-error fallbacks.
- Validation passed: `npm run quality:quick`, `npm run lint:report` (advisory warnings only),
  and `npm run agent:verify` (83 test files, 596 tests). Read-only code review found no actionable
  issues. The dynamic client import boundary is unchanged, so no production build was required.
- Task 6 remains open. [Performance notes](../docs/PERFORMANCE_NOTES.md) record measured asset
  counts and the exact limitations; those static numbers do not replace a full-room runtime run.
  Phase 26's demo fixture does not yet exist. No manual/live browser checks were performed, per the
  user's instruction. User visual checks and runtime metrics are still unverified.

Keep this plan and its index row until the runtime exit gate is met; implementation is not a claim
that the unmeasured benchmark or manual checks passed.

## Problem

`src/features/creator/scene/scene-preview.tsx` (139 lines) receives only `project`. It renders the
room shell, obstacles, wall markers, use-zone overlays and either a GLB or a grey fallback box per
placement, with a per-placement `Suspense` and an error boundary. It reads neither `selectedId` nor
`validation.issues`, so switching from the 2D plan to 3D silently drops both the selection and every
collision or clearance marking the user was just looking at. There is also no measured evidence that
a full room stays responsive; Phase 16 explicitly deferred that benchmark here.

## Scope

In scope: passing selection and validation into the scene, presenting both in a way that mirrors the
2D plan, optional click-to-select, and one recorded performance measurement of a representative room.

Out of scope: editing in 3D, dragging, rotation handles, any validation computed from the scene, new
models or model fixes (Phase 16), the 10 cm grid, per-entity labels and dimension annotations. The
scene stays a read-only view of the same store.

## Decisions

**D1 — the scene renders state, it never derives truth.** No dispatch from the scene, no geometry
recomputed in scene space, no validation inferred from mesh intersections. Highlighting reuses
`entityIssueState` from `src/features/creator/plan/entity-issue-state.ts`, the same function the 2D
entities use, so the two views cannot disagree.

**D2 — selection and issues arrive as props, not through the store.** `ScenePreview` already takes
`project` as a prop from `EditorWorkspace`, which owns `selectedId`. Keeping the pattern avoids a
second subscription path and keeps the component testable without a store.

**D3 — selection is an additive outline, issues recolour the existing use-zone and fallback
materials.** Do not replace the GLB materials; a selected or invalid product must still be
recognisable. The 2D vocabulary is amber for selection, red dashed for errors and caution for
warnings; the 3D equivalent uses the same tokens as emissive outline and overlay tint.

**D4 — click-to-select is in scope only if it costs one raycast handler.** Clicking a placement or
obstacle calls the same `select(id)` callback the 2D plan uses. If pointer handling turns out to
fight `OrbitControls`, drop it and keep one-way sync; the exit gate only requires that 3D reflects
selection.

**D5 — the benchmark is a recorded number, not a passing test.** Frame timing is machine-dependent,
so it must not become a flaky CI gate. Measure once, record the method and the numbers in the
repository, and treat a regression as a review question.

## Implementation tasks

1. **Widen the component contract.** Extend `ScenePreviewProps` with `selectedId: string | null`,
   `issues: readonly PlanIssueRef[]` and an optional `onSelect`. Pass them from
   `creator-editor.tsx`, which already holds `visibleSelectedId` and can select
   `state.validation.issues` the same way `room-plan.tsx` does.

2. **Scene visual state.** New `src/features/creator/scene/scene-entity-state.ts`: a pure
   `sceneEntityAppearance(id, selectedId, issues)` returning the colour, emissive and opacity for an
   entity, built on `entityIssueState` so error beats warning and selection composes with both. Keep
   the colour constants in one exported map that the tests can assert against.

3. **Apply it.** Use the appearance in `Box`, `UseZoneOverlay`, `WallMarker` and the GLB group in
   `scene-preview.tsx`. Add a selection outline that does not depend on GLB material internals — a
   thin wireframe or bounding box at the placement envelope is sufficient and works identically for
   modelled and fallback products. Watch the file budget: `scene-preview.tsx` is at 139 lines, so
   extract the entity components into a sibling file if it approaches 300.

4. **Optional click-to-select.** Attach `onPointerUp` handlers that call `onSelect(id)` and stop
   propagation, and confirm `OrbitControls` still orbits. Drop this task without ceremony if it
   proves fiddly; note the decision in the summary rather than leaving it half-wired.

5. **Preloading.** The only preload today is `useGLTF.preload("/assets/squat-rack.glb")`. Replace it
   with a loop over `visualAssetRegistry` for the products actually present in the current project,
   so opening 3D on the demo room does not stagger four separate loads. Do not preload the entire
   registry; that would pull every GLB into a session that needs four.

6. **Benchmark a representative room.** Using the Phase 26 demo project extended with dumbbells, a
   wall accessory and the treadmill, record in `docs/PERFORMANCE_NOTES.md`: loaded assets, triangle
   count, draw calls, texture memory where the browser reports it, time to first rendered frame after
   the 2D/3D switch, and observed responsiveness while orbiting at the editor viewport. Note the
   machine and browser. This closes Phase 16 task 5, which was deliberately deferred here; link it
   from that plan rather than measuring twice.

## Acceptance criteria

- Selecting an entity in the 2D plan, then switching to 3D, shows that entity highlighted.
- Selecting in the list panel highlights in 3D without a round trip through 2D.
- An entity in a collision or bounds error is visibly marked in 3D, and a warned entity is marked
  differently from an errored one.
- An entity carrying both a selection and an error stays identifiable as both.
- Pairwise issues mark both entities, matching the 2D behaviour.
- Products without a GLB show the same selection and issue treatment on their fallback box.
- A missing or corrupt GLB still falls back per placement and leaves the rest of the scene, the
  editor, validation and undo fully usable.
- The scene dispatches nothing; the store revision is unchanged by any interaction with it.
- The benchmark is recorded with its method and the room stays interactive at the demo viewport.

## Tests

- `src/features/creator/scene/scene-entity-state.test.ts` — selection only, error only, warning
  only, error beating warning, selection composed with error, unknown ID, empty issue list.
- `src/features/creator/scene/scene-transform.test.ts` — unchanged; assert no regression.
- `src/features/creator/components/creator-editor.test.tsx` — extend the existing 2D/3D switch case
  to assert the scene receives the current selection and issues, keeping the assertion at the props
  boundary rather than attempting to render WebGL under jsdom.
- Do not add an R3F rendering test. There is no Canvas harness in this repository and building one
  is disproportionate this close to submission; the pure appearance function carries the logic.

## Manual checks

In the browser: open the demo project, select the bench in 2D, switch to 3D, confirm the highlight;
create a collision by moving the rack, confirm both entities mark red in 3D; delete a GLB locally and
confirm the fallback path; orbit a full room while watching for stutter.

## Narrowing rule

If the schedule tightens, ship tasks 1 to 3 and 6 and drop click-to-select and preloading. Selection
and validation presentation are the exit gate; the rest is polish.

## Exit gate

All acceptance criteria hold, `npm run agent:verify` passes, and the benchmark is recorded. A
production build is required only if the dynamic import boundary changes. Delete this file and its
index row afterwards; keep `docs/PERFORMANCE_NOTES.md`.
