# Freestanding dip bars — model and catalog integration

User approved the adjustable photo v2 and requested model plus integration.

Status: implemented and verified. Photo v2, GLB and derived SVG are mapped to the new product.

## Specification

- One fictional Kiln Strength product, `product_freestanding_dip_bars`, slug `freestanding-dip-bars`, name Freestanding Dip Bars. Pair priced once at PLN 499.
- Floor placement; entire pair occupies one 120 × 80 cm rectangle, including the gap. Authored static height 110 cm. Stand centre spacing 66 cm; each transverse foot 54 cm wide. No rack or wall dependency.
- Fictional use margins: front/back 80 cm, left/right 40 cm; minimum ceiling 210 cm. These are planning assumptions, not manufacturer or exercise safety specifications. Omit unverified mass and load rating.
- Four telescopic legs, visible holes, collars and black locking knobs; two rounded rails with black grips; four rubber-ended feet. Static presentation, no new adjustment controls in the planner.
- Photo v2 is the form reference; model matches the established simplified room-view detail level.

## Work and validation

1. Generate deterministic GLB with exact envelope and floor pivot, merged by material, below existing 1 MB / 18k-triangle budgets.
2. Generate SVG top view and offline front/rear previews; inspect geometry and adjustment details.
3. Register photo/model/top and seed; verify search, single pair price/placement, undo/redo and asset consistency. Preserve existing identities and saved projects.
4. Focused tests, quality:quick, lint:report, agent:verify; build because the new product generates a static detail route. Browser review remains paused.
5. Record metrics, assumptions and verification in model documentation and coverage plan.

## Results

- GLB 319,552 bytes, 9,584 triangles, four material groups; exact authored bounds verified.
- Offline front/rear review and independent review found no actionable defects.
- Focused generator/integration tests and full gate passed: 973 tests in 107 files.
- Production build passed; generated `/catalog/freestanding-dip-bars` HTML references photo v2.
- Quality gate passed. Browser/GPU review remains intentionally paused; this is not a deploy.
- Details and reproducible commands: [model documentation](../docs/FREESTANDING_DIP_BARS_MODEL.md).
