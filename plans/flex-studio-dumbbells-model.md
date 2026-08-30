# Flex Studio Dumbbells — model

User accepted the colorful photo and requested a matching simplified 3D model.

Status: complete. Photo, GLB and derived top view mapped to existing Flex; seed unchanged.

- Preserve existing `product_flex_studio_dumbbells`, price PLN399, mass18kg and all catalog behavior.
- Six fully coated dumbbells: coral, sage and blue pairs with rounded hexagonal heads and waisted grips. No rack, metal grips, labels or inferred individual mass values.
- Compact display inside the existing 46×24×18cm envelope: blue and green pairs lie flat in two columns, coral pair stands on end at the front. Form/colors follow the photo; display arrangement differs to fit the existing footprint without stretching equipment or changing stored geometry.
- One static GLB with three material groups; no interactive separation of individual weights. Floor pivot Y0, centered X/Z, -Z forward, scale1.
- Generate derived top SVG and front/rear offline previews. Register approved photo and model/top against existing Flex ID, no new seed or route.
- Validate exact bounds, reproducible GLB/SVG, budgets, unchanged seed and mappings; run focused tests, quality:quick, lint:report and agent:verify. Browser review remains paused. No build required for asset-only existing-product changes.

Verified: 537,348-byte GLB, 10,320 triangles, three material groups, exact bounds; front/rear
offline preview inspection and independent review passed. Full gate: 976 tests in108 files;
quality:quick passed; lint reports36 pre-existing warnings and no new-file warnings. Details:
[model documentation](../docs/FLEX_STUDIO_DUMBBELLS_MODEL.md).
