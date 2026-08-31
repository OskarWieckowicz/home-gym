# Phase 24 — Creator polish

> Order 1 in the [active queue](README.md). Do this before landing, catalog, premium look and
> submission. Catalog sidebar polish remains cut.

## Scope and boundaries

Polish the creator so the shared 3D/2D editor looks finished and stays usable under ordinary
editing. The work is visual refinement, interaction reliability and removing flicker — not new
planning features, not a product-asset production pass, and not a rewrite of the domain engine.

Keep the existing editor contract in [the editor specification](../docs/EDITOR_MOCKUP.md): one
shared model for UI and WebMCP, 3D primary, 2D and geometric fallbacks available, English chrome,
deterministic geometry. Do not reopen cut scope (activity feed, named access, visible derived
paths, `check_access`, special rack/bench collision exemptions, summary export).

Do not reopen the product visual-asset queue. Per-model recognizability, kettlebell silhouette
refinement and complete-room runtime metrics stay out of this phase; do not claim them from
general editor checks.

## Remaining outcome

- Creator chrome, viewport overlays, selection and inspector feel coherent and finished.
- Ordinary placement, selection, camera, 2D/3D switch, undo/redo and panel updates work without
  obvious stalls or layout jumps.
- Elements that currently flicker (loading, selection, overlays, panels, status, thumbnails or
  scene chrome) stay visually stable across those transitions.

## Work sequence

1. Reproduce flicker and interaction glitches in the live creator (`/creator` and
   `/creator?start=demo`): scene load, selection changes, tab switches, camera moves, 2D/3D
   switch, inspector updates and overlay/status changes.
2. Fix the visual and interaction defects that affect the main editing loop. Prefer the smallest
   change that removes the flicker or jump; do not add motion libraries or new layout systems.
3. Tighten creator presentation where it still looks unfinished: spacing, hierarchy, control
   grouping, empty/error states and overlay readability. Stay on existing tokens and primitives.
4. Re-check the same flows after the fixes, including a furnished demo room and a fresh
   Start planning project.

## Exit gate

The creator is visually and operationally ready for landing captures and later public-build
checks. Remaining flicker or interaction issues are either fixed or explicitly deferred with a
reason. Transfer durable editor decisions into `docs/EDITOR_MOCKUP.md`, then remove this plan
and its index row.
