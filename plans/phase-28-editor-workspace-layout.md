# Phase 28 — approved editor workspace mockup

User approved the English-only desktop mockup on 30 August 2026. Implement its hierarchy and
spacing using current assets and shared commands, not the illustrative generated equipment.

## Scope and implementation sequence

1. Compact project header: brand/home link, title, persistence status, Project disclosure with
   existing import/export/reset. Remove marketing chrome only on the creator route.
2. Shared viewport toolbar outside the lazy scene: 2D/3D, undo/redo, dimensions. In 3D expose
   Fit view, with Top view secondary. Keep switching available during scene loading/failure.
3. Left sidebar with accessible Equipment / Room / Project items tabs. Preserve search state,
   room tools, all existing selection/placement/add operations; expose real catalog categories.
4. Larger viewport with bounds-based camera fitting, no automatic reset on ordinary edits.
   Short gesture help beneath scene, temporary placement controls only when needed.
5. Contextual Properties panel; no-selection returns room properties. Collapse Layout checks
   details by default while retaining live counts and an explicit missing-door indication.
6. Desktop fills viewport with independently scrollable sidebars; narrow screens preserve DOM
   order and reachability instead of trapping page scroll. Keep visible keyboard focus.
7. Adapt tests to actual tabs/disclosures, add keyboard and shared-history regressions, review
   critical UI flows, run quality:quick, lint:report, agent:verify and build. Verify desktop/narrow
   layout and 3D select/move/undo/2D fallback in the real browser. Record evidence and limitations.

No new project schema, storage key, validation policy, asset generation, WebMCP path or deployment.
Keep user changes; each changed non-test file remains under 500 lines.

## Completion

Implemented and locally verified on 30 August 2026. `agent:verify` passes 953 tests in 105 files;
`quality:quick` and the production build pass. Read-only review completed. Browser observations
and device-testing limits are recorded in `docs/PHASE_28_WORKSPACE_VERIFICATION.md`.
