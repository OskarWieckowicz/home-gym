# Phase 29 — Project summary verification

Verified locally on 30 August 2026. No deployment performed.

## Delivered

- `/summary` restores the existing local project without a start action or mutation. Empty
  projects show an empty state based on equipment content, not on persistence status.
- Creator toolbar entry; summary toolbar with brand, creator/catalog links, canonical JSON export
  and return to editing. Marketing chrome is absent on both application routes.
- One pure `buildProjectSummary` supplies item rows, prices, budget, coverage, checklist, detailed
  errors/recommendations, room and floor figures to both UI and `get_project_summary`.
- Read-only 2D plan and lazy 3D scene. No editing controller, picking or mutation path is installed.
  Scene failure/context loss switches back to 2D without replacing the project.
- Summary bridge registers exactly `get_project_state`, `get_project_summary`, `validate_layout`.
  Creator has 21 tools. Catalog registration remains unchanged.
- Shared validation descriptions and catalog formatting retain the domain import boundary.
- Print/download-summary action explicitly cut as optional; JSON export retained. No PDF dependency,
  new products/assets, server persistence, shareable summary URLs or commerce were added.

## Floor metric definition

Room area minus the **exact union**, clipped to the room rectangle, of placed floor-occupying
equipment, physical obstacles and explicit unavailable zones. Axis-aligned rectangle edges are
swept in X and merged Z intervals are integrated; overlapping rectangles count once. This is not
a sampling/grid approximation. Rotation uses the existing deterministic footprint function.

Overhead wall-mounted equipment is excluded unless its mounting contract says `blocksFloor`.
Current doors/windows have no floor intrusion; they contribute zero. Exercise use zones are not
subtracted. Free floor is not a substitute for use-zone or access validation.

Unknown placed-product geometry makes occupied/free area, ratio and percentage `null`, with
“Unknown” display labels; room area remains known. Unknown product prices are `null` and totals
are marked incomplete, never represented as a known zero-price product.

## Demo anchor

| Figure | Bundled demo |
|---|---|
| Room | 400 × 320 × 240 cm; 12.8 m² |
| Selected/placed items | 4 / 4 |
| Total / budget | PLN 8,596 / PLN 10,000 |
| Remaining | PLN 1,404 |
| Goals | 2/2: strength, muscle gain |
| Physical collisions | 0 |
| Validation | 0 errors, 5 warnings; valid with recommendations |
| Occupied / free floor | 41,552 / 86,448 cm² |
| Free ratio | 0.675375, displayed as 68% |

The demo retains a retired catalog product. Its budget test now uses the same project-product
resolver as the editor, including retired records, rather than searching only the active catalog.

## Automated evidence

- Narrow summary/scene component suite: 12 passing tests.
- Domain summary/floor suites cover exact union, obstacles, clipping, rotations, overhead mounts,
  missing products, unplaced/selection-only purchases, zero/exceeded budget, coverage and every
  validation issue code. Height/mounting/opening errors cannot leave every checklist row passed.
- WebMCP tests cover shared-payload parity, live state, detached serialization, strict inputs,
  cancellation, descriptor limits, no dispatch/history changes, read-only subset and cleanup.
- Component tests cover table totals/rows, empty state, budget warnings, read-only pointer/drop/
  keyboard interactions, view switching, scene error/context-loss recovery, JSON export parity,
  cold visits and repeated restoration without storage writes.
- `npm run quality:quick`: passed.
- `npm run lint:report`: no blocking errors; advisory warnings remain in existing complex modules
  and long test suites. No new production summary component warnings.
- `npm run agent:verify`: 126 files, 1,115 tests passed; lint, TypeScript, duplicate detection and
  500-line source guard passed. Duplicate lines: 0.71%.
- `npm run build`: passed; `/summary` appears as a static route with client restoration.
- `git diff --check`: passed.

## Browser evidence

Isolated agent-browser session, local Next development server on port 3002, Headless Chrome
152.0.0.0 on macOS. This browser exposes `document.modelContext`; no user profile was modified.

- Cold `/summary`: meaningful empty state, no error overlay, zero localStorage entries.
- `/creator?start=demo` → **View summary**: correct demo figures and default 2D preview.
- Native WebMCP discovery returned exactly the three read-only summary tools. Executing
  `get_project_summary` matched the UI totals, goal ratio, floor percentage and issue descriptions.
  This browser's diagnostic `executeTool` accepts the JSON string `"{}"`; production registration
  and handlers do not depend on that diagnostic helper signature.
- Changed budget manually to PLN 8,000: UI and WebMCP both showed PLN 596 excess and a failed
  budget checklist row. Reload preserved the edited budget.
- Export downloaded canonical v4 JSON. Return to editing left localStorage byte-for-byte unchanged.
- Re-importing that downloaded JSON in the creator restored the original PLN 10,000 budget;
  reopening the summary restored the matching PLN 1,404 balance.
- 2D and 3D rendered. Browser testing found and fixed an initial fallback lifecycle bug: R3F mounts
  its `fallback` as canvas child content even when supported, so it must not run an unconditional
  fallback effect. A regression test now models that exact behavior.
- Desktop 1440 px, tablet 768 px and phone 390 px layouts checked. At 390 px the page had no
  horizontal overflow; the equipment table scrolls within its own container.
- axe-core 4.12.1 on the desktop 2D summary: zero violations and zero incomplete checks after
  making reused SVG entity controls inert. The 3D wrapper uses group semantics for camera/recovery
  controls rather than claiming an atomic image containing interactive controls.
- Repeated the desktop axe audit in 3D: zero violations and zero incomplete checks. Simulated
  `webglcontextlost`: automatic 2D fallback, focus returned to the 2D button, localStorage unchanged.
- Final scoped code review confirmed both initial findings fixed and found no remaining blocker.

## Remaining release checks and limitations

Phase 24 must verify the deployed summary in Chrome and the ChatGPT/Codex agent host, record the
actual supported flag/browser versions, and include the surface in the README and demo script.
Local browser/unit checks do not certify every GPU, touch device or screen reader.

The summary follows the existing single-localStorage-slot architecture. If storage is unavailable
or saving fails, navigation can restore only the last durable project, not the editor's unsaved
in-memory edits; the existing persistence warning remains visible. No shared cross-route in-memory
store or history persistence was introduced. Undo history remains editor-session-local.
