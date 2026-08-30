# Phase 26 — demo bootstrap verification

Implemented and locally verified on 30 August 2026. Public deployment is not part of this phase.

## Behavior and decisions

- `/creator` restores the current saved project. Generic Creator/Open creator links, including
  product cards and catalog navigation, resume rather than clear a project.
- `/creator?start=demo` and `/creator?start=new` deliberately replace the project with a demo or
  empty baseline. Each is saved under `home-gym-creator.project` before the editor/tools mount.
- Start actions are consumed once with native `history.replaceState`. Only `start` is removed;
  other parameters and the fragment survive. Refresh resumes the last saved edits. Opening an
  explicit start URL again deliberately starts again. Repeated/invalid values mean ordinary restore.
- A client entry under Suspense observes query changes. Its session key changes for explicit
  starts, not URL cleanup. This replaces the original server-only proposal and allows `/creator`
  to retain a prerendered loading shell. Store, undo history and UI state survive URL cleanup.
- New project uses one baseline write instead of clear-then-write. On storage failure, the
  requested project remains editable in memory with a visible failure status; the URL is consumed
  without pretending persistence succeeded. A previous saved project may remain and reappear on
  reload in this failure case. No multi-project storage or recovery copy was introduced.
- Factory decoding validates schema/migration. Persistence separately validates product resolution.
  Bundled fixture/catalog consistency is a release invariant enforced by tests, not a user-import
  fallback path. The old v3 migration fixture is unchanged.

## Demo facts

Source: `src/features/project/fixtures/demo-project.json`, loaded by `createDemoProject()`.
The factory returns independent nested data each time.

- Room: 400 × 320 × 240 cm; fixed wardrobe 80 × 60 × 220 cm at (300, 0).
- Top-wall entry: offset 195 cm, width 90 cm.
- Four placed products: Northstar Half Rack, Arc Adjustable Bench, Ironvale Barbell Set,
  Foundry Bumper Plates. Budget PLN 10,000; current catalog total PLN 8,596.
- Requested strength and muscle-gain goals are covered.
- Validation: zero errors, five warnings — four use-zone overlaps and tight access to plates.
  Access is evaluated; no unreachable entities. These are application checks, not a claim that
  every exercise can occur simultaneously or that the layout meets building/safety regulations.
- Current asset fallbacks remain visible for products without mapped visuals. Asset completion
  and polished screenshots still belong to the existing asset/landing work, not this phase.

## Automated verification

- Focused route, navigation, fixture, persistence and shared-editing tests pass.
- `quality:quick` passes; `lint:report` has advisory warnings but no blocking errors.
- `agent:verify` passes: 107 test files, 978 tests; lint, TypeScript, duplicate detection and
  the 500-line non-test source/configuration guard pass.
- `npm run build` passes; `/creator` retains a static shell with the query-aware client entry
  behind Suspense.
- Independent read-only review found no actionable defect. Follow-up test covers aborting the
  previous tool-registration signals and registering exactly one fresh 20-tool set on each
  explicit start, with no extra registration during URL cleanup.

Tests cover fresh/existing storage, invalid and repeated parameters, one StrictMode seed write,
URL cleanup preserving other params/hash, same-route restore/demo/new/repeated-demo transitions,
storage denial/quota failure, revision-zero baselines, manual edits observed by WebMCP, agent edits,
shared undo/redo, and restoration without a start mode. Existing import/export/reset tests remain.

## Browser verification

Production build served on isolated `http://127.0.0.1:3016` in the Codex in-app browser; the user's
normal development origin and saved project were not used. Desktop view at 1280 × 720.

- Landing demo CTA opened the four-product layout in 3D and normalized the address to `/creator`.
- Project items list and 3D screenshot showed all four products, wardrobe and entry.
- Actual `get_project_state` reported revision zero, no undo, zero errors and five warnings.
- Manual width change 400 → 450 was observed by WebMCP at revision one. Agent budget change
  to 12,000 was undone through the UI; the manual width remained. Reload restored width 450.
- Returning through the catalog's Creator link retained width 450. Reopening the landing demo
  link reset the baseline to width 400. New-project CTA produced an empty project; width 430
  survived its subsequent reload.
- Directly pasting the demo URL after that existing project restored the demo baseline.
- Switching to 2D retained the project. No captured console errors during this flow.

## Remaining acceptance boundaries

No public deploy, Chrome-host acceptance, device/touch or GPU-failure retest was performed here.
Phase 24 must verify the deployed revision and run its complete shared-editing script in both
required hosts. Native import/export/reset were covered by the existing automated suite, not
repeated through browser file dialogs in this pass.
