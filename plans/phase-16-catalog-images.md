# Catalog images from existing models

## Scope

Finish the three remaining catalog photos listed below, using their existing GLBs and the
established studio style. No browser verification is requested.

## Workflow for each remaining image

1. Render the product GLB with `scripts/render-product-reference.mjs`; choose `front` or `rear`
   to show its identifying features.
2. Use `imagegen` to match the existing catalog photos while preserving the source geometry.
3. Save the image under `public/assets/`, its prompt/source record under
   `scripts/catalog-image-provenance/`, and update the catalog mapping and regression tests.
4. Run focused checks, `quality:quick`, `lint:report`, `agent:verify`, and production build.

## Remaining photo queue

- Current Fold Bike
- Quarry Power Bar
- Foundry Bumper Plates

Resume only at the user's request. Keep dimensions, GLBs, top views and domain rules unchanged.
Remove each completed entry; delete this plan and its index link when the queue is empty.
