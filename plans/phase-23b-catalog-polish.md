# Phase 23B — Catalog polish

> Order 1 in the [active queue](README.md). Final submission depends on this slice.
> Updated: 30 August 2026. No photo-generation prerequisite remains.

## Problem and scope

The [catalog sidebar](../src/features/catalog/components/catalog-project-summary.tsx) still shows
static “Selected equipment” and “Build your room first” copy promising future room placement,
although the creator already works. It never reflects the current project.

Replace this misleading presentation with a clear link to the creator, or remove the panel.
Do not wire project state into the server-rendered catalog. No catalog redesign, new products,
sort control, query/filter changes, creator/domain/WebMCP changes or asset generation are in scope.
Use existing Tailwind styles, primitives and tokens without a new dependency or layout system.

## Implementation tasks

1. **Resolve the sidebar.** Remove the static summary or reduce it to honest creator-entry copy.
   If retained, Open creator must resume the existing project rather than replace it.
2. **Verify existing image coverage without reopening production.** All 23 active products already
   have mapped photos: 21 placeable products and two selection-only accessories. There is no
   Foundry or other missing-photo queue. Keep card/detail images and the defensive missing-image
   fallback coherent; an unmapped future product needs an explicit image/fallback decision.
3. **Keep affected copy accurate.** Use the current seeds and mapping registry when a count is
   needed; do not reintroduce historical catalog totals or placeholder implementation claims.

## Acceptance and validation

- The catalog no longer presents a static project selection as live or future functionality.
- All current cards/details retain their images and provenance. Any future intentional fallback
  has a recorded reason and consistent presentation on both surfaces.
- Filters, empty state, product details and the two catalog WebMCP tools behave as before.
- Phone, tablet and desktop layouts remain coherent, with stable image sizing and no horizontal
  overflow. Check the retained creator link resumes the project.

Use existing [photo mapping tests](../src/features/catalog/product-assets.test.ts),
[catalog retirement coverage](../src/data/products/catalog-retirement.test.ts) and detail-page
image/fallback tests. Retirement coverage already asserts photo/top-view mappings for all 21
placeable products; do not duplicate it. Add or update focused rendering assertions only for the
changed sidebar behavior or an actual fallback change.

Run focused tests, `npm run quality:quick`, `npm run lint:report`, `npm run agent:verify` and
`npm run build` for the catalog page-composition change. Verify the deployed catalog logged out
at phone, tablet and desktop widths, including image loading, filters, empty state and creator
entry. Record the revision tested; asset-model review remains separately paused.

Remove this plan and its index row when the acceptance criteria hold.
