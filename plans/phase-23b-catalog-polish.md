# Phase 23B — Catalog polish

> Order 2 in the [active queue](README.md). Uses Phase 16 catalog asset coverage decisions.
> Blocks Phase 24. Independent of [Phase 23A landing work](phase-23a-landing-polish.md);
> the queue order is sequencing, not a technical dependency.

## Problem

The catalog page and product detail page are functionally complete — filters, cards, empty state,
WebMCP bridge and mapped product-detail images. Unmapped products still render
"Product image coming later", and the project summary sidebar remains a static placeholder.
Catalog totals in documentation also need reconciliation against the current seed data.

## Scope

In scope: catalog image coverage or an explicit fallback decision shared by cards and the existing
detail-page image surface, removing or repurposing the static catalog sidebar, and correcting
catalog totals in documentation.

Out of scope: a broader catalog UX/UI redesign, new catalog products, changes to filters or catalog
queries, a working sort control, a live project summary in the catalog sidebar, landing page polish
(owned by Phase 23A), and any change to the creator, the domain layer or the WebMCP tools.

## Decisions

**D1 — every missing photo needs an explicit fallback decision.** Every current catalog product
either has an image or is recorded as an intentional fallback with a reason. Replace remaining
"Product image coming later" copy with a neutral category-shaped placeholder on cards and detail
pages. Do not expand the approved generation queue to fill every gap.

**D2 — the catalog sidebar placeholder is cut, not faked.** A static "Build your room first" panel
that never updates is worse than no panel. Either remove it or turn it into a link into the creator.
Wiring real project state into a server-rendered catalog page is out of scope.

**D3 — no new dependency and no new layout system.** Use the existing Tailwind v4 setup, shared
primitives and tokens already in `globals.css`.

## Implementation tasks

1. **Missing-photo presentation.** The separate [photo queue](phase-16-catalog-images.md) contains
   only Foundry Bumper Plates and resumes at the user's request. Current Fold Bike and Quarry
   Power Bar already have mapped photos. Apply D1 to other unmapped products and record intentional
   fallbacks; keep cards and the existing detail-page image block consistent. Update mappings and
   regression tests together when coverage changes.

2. **Sidebar decision.** Apply D2 to `catalog-project-summary.tsx`.

3. **Stale facts.** Reconcile catalog totals in documentation against the current seed data,
   rather than retaining old hard-coded product counts.

## Acceptance criteria

- Every catalog card and every detail page either shows a product image or a deliberate placeholder,
  and the intentional fallbacks are recorded with reasons.
- No image is committed without recorded provenance and a clear license, per the repository rule on
  visual assets.
- The static project-summary placeholder is removed or replaced with a working link to the creator.
- Catalog totals in the updated documentation match the current seed data.
- The catalog filters, the empty state and the two catalog WebMCP tools behave exactly as before.
- Catalog cards, product details and the sidebar decision render coherently at phone, tablet and
  desktop widths without image-driven layout shifts.

## Tests

- `src/features/catalog/product-assets.test.ts` — extend to assert that every catalog product ID is
  either mapped to an existing file or listed in an explicit fallback set, so a new product cannot
  silently ship without a decision.
- `src/app/catalog/[slug]/page.test.tsx` — update existing image/fallback assertions for D1.
- Add or update focused catalog rendering tests for card fallbacks and the chosen sidebar behavior.

## Manual checks

Open the deployed catalog logged out at phone, tablet and desktop widths. Check products with
mapped images and intentional fallbacks on both cards and detail pages. Confirm image loading does
not shift layout, exercise filters and the empty state, and check the creator link if retained.

## Exit gate

All acceptance criteria hold, `npm run agent:verify` passes, and `npm run build` passes because
catalog page composition changed. Delete this file and its index row afterwards, and delete
`phase-16-catalog-images.md` if its queue is empty by then.
