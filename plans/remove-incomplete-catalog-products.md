# Remove 16 incomplete products from the active catalog

User explicitly requested removing the 16 floor-placeable products without both image and model.

- Active catalog becomes 24 products: 21 placeable with photos/models and three shopping-only
  accessories (roller, bands, wraps). No new asset generation.
- Move the exact removed specifications into isolated retired records used only for legacy
  projects. Remove them from category seeds, active search/details and generated product routes.
- Preserve legacy project items, placements, IDs, prices, dimensions and history. Retired items
  remain editable/removable in old projects; unknown products remain invalid.
- Reject fresh shopping items, direct new placements and product-ID suggestions for retired
  products through shared domain operations. Existing project-item actions remain supported.
- Update catalog counts, focused query/legacy tests and live documentation. Historical migration
  fixtures remain unchanged so compatibility is tested against real prior data.
- Run focused tests, quality:quick, lint:report, agent:verify, build, and independent review.
  Browser review remains paused; no deployment or destructive saved-project migration.

Status: complete.

## Removed active entries

Foundry Folding Wall Rack; Cove Folding Bench; Crest FID Bench; Ironvale Barbell Set;
Axis Training Bar; Stream Curl Bar; Rook Technique Plates; Nook Compact Dumbbells;
Quay Hex Dumbbells; Rill Compact Rower; Breeze Air Bike; Stride Walking Pad; Peak Stepper;
Groundwork Mobility Kit; Orbit Suspension Trainer; Pulse Jump Rope.

## Verification

- Active catalog: 24 products, including 21 floor-placeable products with photos and models.
  Roller, Signal bands and Cove Wrist Wraps remain shopping-list-only. Only the wraps lack a photo.
- All 16 retired IDs fail new additions, direct placement, product-ID suggestions and active
  details. All 16 retired slugs return 404 from page/metadata and are absent from static params.
- Unchanged historical v3 fixture still restores all four purchases and placements at 8596 PLN;
  legacy imports, movement, re-placement and undo/redo remain supported.
- Updated placeholder tests use the still-active Cove Wrist Wraps. Historical project fixtures
  retain retired IDs deliberately and resolve through the separate project lookup.
- quality:quick passed; lint:report: zero errors, 36 existing warnings.
- agent:verify passed: 1010 tests / 114 files. Build passed; prerender manifest contains exactly
  24 product routes and zero retired routes. Diff check passed.
- Independent reviewer ran 66 tests and found no material defects. Minor remaining coverage gap:
  re-placement of a legacy item is covered by domain/plan tests, not a dedicated WebMCP-handler test.
- Browser/GPU verification remains paused. No deployment or saved-data deletion.
