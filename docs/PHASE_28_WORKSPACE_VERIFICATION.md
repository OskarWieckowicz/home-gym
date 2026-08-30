# Phase 28 — editor workspace verification

Local verification on 30 August 2026. Implements the approved English-only workspace hierarchy,
not new project semantics or a deployment.

## Status

**Completed — closed at the user's request on 30 August 2026.** The approved workspace layout
is implemented and locally verified. The completed plan was removed from `plans/` according to
the repository convention and remains available in Git history. The device and deployment
limitations below remain unchanged; closure does not claim additional verification.

## Automated checks

- `quality:quick`: lint errors, TypeScript, 500-line source limit and duplication gate pass.
- `agent:verify`: 105 test files / 953 tests pass; all canonical gates pass.
- `npm run build`: optimized webpack production build passes, including creator and catalog routes.
- `lint:report`: advisory maintainability warnings remain; no blocking errors.
- Read-only reviewer: no remaining actionable findings after fixing the scene keyboard-focus ring.

Coverage includes keyboard tab navigation and preserved filters, placement cancellation on tab
change, retained selection/history, real Project disclosure interactions, collapsed live validation
counts, explicit camera requests cancelling gestures, lazy/failing-scene fallback, route-specific
chrome, popover Escape/outside-focus handling and projected-camera corner bounds. Camera tests
include extreme room dimensions/aspects and no reset on ordinary project revisions.

## Browser observations

Tested the production build at `127.0.0.1:3002/creator`, separate from the user's development origin.
The existing synthetic obstacle was retained; test edits and a temporary bench were undone.

- 1280 × 720: three columns, independent catalog/inspector scroll, no page overflow
  (`scrollWidth=clientWidth=1280`, `scrollHeight=clientHeight=720`).
- Project header and scene toolbar are separate; no marketing header/footer, Reset view button
  or visible duplicate scene title. 2D/3D, history, dimensions and Fit view are next to the scene.
- Room fills the usable viewport with both side walls visible at the initial fit.
- Catalog category + text search produce the expected bench and survive Room → Equipment.
- Selecting from Project items updates Properties. An exact X edit followed by Undo restores
  the original coordinate; switching to 2D preserves selection and the same value.
- Place → Place at centre creates the selected bench with real image, price, dimensions and
  position fields. Collapsed counts expose a deliberate physical collision; expanding Layout
  checks exposes its explanation and missing-door information. Undo removes the test bench.
- Camera views → Top view, Escape and Fit view work without creating undo history.
- Project reveals file actions, preserving their existing implementation.
- Focusing the 3D surface shows a computed `rgb(37, 99, 235) solid 3px` outline.
- A temporary same-origin 390 × 844 iframe visually checked the narrow layout: compact header,
  bounded catalog, wrapped view toolbar and scene below it. The temporary fixture was removed.
  The iframe correctly reports WebMCP unavailable there; this is not a top-level registration test.

## Limits

This is local desktop-browser verification, not real-device mobile/touch or deployed-browser
acceptance. Narrow-layout checks used an iframe, not device emulation. Native import/export,
manual drag arbitration and cross-agent cancellation retain unit/integration coverage; those full
flows were not all repeated on a GPU in this UI-only pass. Earlier Phase 27 device limitations
still apply. No project schema, command contract, validation policy or storage key changed.
