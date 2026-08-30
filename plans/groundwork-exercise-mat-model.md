# Groundwork Exercise Mat model

User requested adding the missing model to the existing catalog product.

- Preserve product identity, price, 65 × 180 × 1 cm deployed footprint, zero use-zone margins,
  floor placement and existing walking/collision behavior. Do not alter Mobility Kit.
- Generate one flat charcoal mat with softly rounded edges and a narrow inset orange border,
  matching the accepted photo. No roll, straps or additional products; no microscopic geometry.
- Register GLB and derived top SVG at scale 1, origin floor pivot, front negative Z.
- Inspect offline GLTFLoader preview; test deterministic output, bounds and mapping.
- Run quality:quick, lint:report and agent:verify. No routes or browser behavior changed;
  browser review remains paused.

Status: complete. GLB and top SVG mapped, preview inspected. Focused 23 tests passed;
quality:quick and agent:verify passed (999 tests / 110 files). Lint: zero errors, 36 existing
warnings. Diff check clean. [Model documentation](../docs/GROUNDWORK_EXERCISE_MAT_MODEL.md).
