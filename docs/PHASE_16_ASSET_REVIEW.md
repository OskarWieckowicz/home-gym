# Phase 16 asset review facts

> Status: toolkit, optimized Summit Power Cage, and MVP adjustable-bench gate accepted.
> Updated: 29 August 2026.

## Reproducible production path

- `scripts/lib/procedural-glb.mjs` owns deterministic box, chamfered-box, cylinder, bounds,
  per-material merging, binary-buffer, and GLB-writing behavior.
- `scripts/lib/equipment-parts.mjs` contains the first genuinely reusable equipment parts: angled
  beams, pads, rubber feet, and wheels.
- `scripts/inspect-glb.mjs` reports the generator, SHA-256, bounds, triangles, nodes, meshes,
  primitives, materials, file size, and normal availability from a generated GLB.
- Small meshes use 16-bit indices. The writer retains 32-bit indices when a merged material group
  exceeds the 16-bit vertex limit.

The toolkit test verifies material-group merging, normals, measured floor bounds, valid GLB
headers, compact indices, and byte-identical output for identical inputs.

## Summit Power Cage optimization acceptance

The optimized model is the accepted `public/assets/squat-rack.glb` runtime asset. The Phase 15
benchmark was retained until the candidate passed visual comparison, then replaced in place so
the explicit product-ID mapping did not change.

| Metric | Phase 15 benchmark | Accepted optimized asset |
|---|---:|---:|
| Bounds (W × H × D) | 1.32 × 2.27 × 1.74 m | 1.32 × 2.27 × 1.74 m |
| Triangles | 11,560 | 11,560 |
| Authored parts | 251 | 251 |
| Runtime nodes / meshes / primitives | 251 / 251 / 251 | 5 / 5 / 5 |
| Materials | 5 | 5 |
| File size | 532,072 bytes | 371,424 bytes |
| SHA-256 | `8145eb151812f455109afc6dff9abf6fef683690aeae25dae337f60daf2c39b6` | `47b56321d87b13a944fa3dabf323f4c55a1620924cfa212c8d91f546d0206350` |

Two independent candidate generations produced the same bytes before acceptance. The final hash
differs only because the accepted generator metadata no longer carries the `candidate` suffix.
The optimization preserves the benchmark primitive construction and changes only how static
geometry is grouped for runtime use.

The optimized appearance was reviewed against the Phase 15 benchmark and accepted by the product
owner on 29 August 2026 as visually identical. The existing bounds discrepancy remains unresolved:
the measured mesh is 2 cm wider, 9 cm deeper, and 2 cm taller than the 130 × 165 × 225 cm catalog
envelope before the current runtime scale is applied. Resolve the family reference dimensions
before deriving the Northstar Half Rack; do not compensate by uniformly scaling that variant.

## Arc Adjustable Bench gate

Current measured facts for `public/assets/arc-adjustable-bench.glb`:

- bounds: approximately 0.66 × 0.943 × 1.409 m (W × H × D);
- floor contact: `y = 0`;
- triangles: 1,664;
- authored parts: 46, merged into 5 runtime nodes and 5 materials;
- file size: 75,196 bytes for the current artifact; the compact-index candidate is 65,212 bytes;
- canonical displayed incline: 35 degrees;
- recognizable authored parts: separate seat and back pads, frame and bracing, seven-position
  adjustment ladder with engaged support, feet, lift handle, wheels, pivot plates, and hardware.

The displayed incline raises the visual bounds to about 94.3 cm while the catalog stores 46 cm as
product height. The product owner accepted this on 29 August 2026: the catalog value represents the
bench's planning/seat height, while the movable backrest may extend above it in the canonical
displayed configuration. This visual extension does not change domain dimensions, collision data,
stored product behavior, or ceiling validation and does not block the bench gate.

The product owner also accepted the model's MVP recognizability in the live room. Deterministic
catalog-base and five-angle evidence renders were removed from the MVP gate on 29 August 2026. The
current catalog concept image remains intentional until presentation polish.

## Deterministic MVP top views

The 2D plan uses transparent SVG views projected directly from accepted GLB geometry. The offline
`scripts/generate-product-top-views.mjs` command reads positions, indices, node transforms, and
material colors, projects upward-facing triangles from positive Y, and writes one SVG per accepted
model. It introduces no browser-rendering or image-generation dependency.

Current outputs:

- `squat-rack-top.svg`: 2,858 projected triangles, 124,664 bytes;
- `arc-adjustable-bench-top.svg`: 430 projected triangles, 21,603 bytes;
- `quarry-power-bar-top.svg`: 218 projected triangles, 10,187 bytes;
- `foundry-bumper-plates-top.svg`: 386 projected triangles, 18,738 bytes.

The SVG is presentation only. The catalog footprint remains the hit target, selection/invalid
outline, collision input, and missing-image fallback. Canonical negative-Z points toward the top of
the generated SVG; placement rotation is applied in the 2D renderer using the same convention as
the 3D scene. The Arc bench was visually checked at 0 and 90 degrees, and all four SVG files were
reviewed directly in the browser without a framework error overlay.
