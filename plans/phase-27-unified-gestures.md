# Phase 27 follow-up — contextual 3D gestures

User decision, 30 August 2026: replace the explicit Edit/Navigate toggle.

Status: implemented and locally verified. Focused tests, quality:quick, agent:verify (890 tests),
build and bounded review passed; real mouse orbit/select/move/undo verified on the local optimized
build. Evidence: [Phase 27 verification](../docs/PHASE_27_3D_EDITOR_VERIFICATION.md#contextual-gesture-follow-up--30-august-2026).
The parent phase's public/device acceptance remains open.

## Contract

- Short primary click selects the hit entity; background click clears selection.
- Primary drag starting on the already-selected entity moves it, using existing commands.
- Primary drag starting elsewhere or on an unselected entity orbits without selection changes.
- Ownership is fixed at pointer-down; crossing an entity does not switch ownership.
- Placement tools temporarily own primary input; centre placement and cancellation remain.
- Camera navigation keeps selection, history and project unchanged. Scroll zoom and native
  inspector/list controls remain available. Additional pointers cancel pending edits/clicks.
- Existing revision invalidation, outside-release cancellation, capture cleanup and fallback stay.

## Implementation and checks

1. Replace controller mode with selected ID and per-gesture ownership. Navigation retains only a
   click candidate; editing captures and blocks native camera pointer-down synchronously.
2. Remove toggle; let camera own unclaimed gestures, suspending during edits/placement.
3. Adapt controller, DOM and camera tests, keeping prior history/cancellation coverage. Add
   unselected drag, background drag/click, crossing targets and select-then-move regression tests.
4. Run focused tests, quality:quick, lint:report and agent:verify; browser-check real orbit versus
   movement and shared history. Request bounded review of event ownership. Update product docs
   and Phase 27 verification without claiming untouched device/public acceptance.

No schema, persistence, domain rules, 2D behavior or WebMCP contract changes.
