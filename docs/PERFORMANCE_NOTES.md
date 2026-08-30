# 3D preview performance notes

Recorded 30 August 2026 for Phase 20 and the shared Phase 16 room-performance task.

## Status and scope

**Static asset measurement completed; full-room runtime acceptance remains open.** No live site was
opened and no manual browser or visual checks were performed, as requested. The available Browser
automation API was inspected, but its evaluation surface is read-only DOM and does not expose a
renderer profiler. No instrumentation was injected into the page and no application browser session
was opened for this measurement. There is therefore no measured frame time, draw-call count or claim
that orbiting the full room stays responsive.

Phase 26's checked-in demo project does not exist yet. The substitute **composition** below uses the
four products from
[`v3-four-product-room.json`](../src/features/project/serialization/fixtures/v3-four-product-room.json)
and adds Range adjustable dumbbells, the Anchor wall pull-up bar, and the Surge treadmill. It is an
asset census for seven placements, not a rendered or validated seven-product layout. The base fixture
has a 400 × 320 × 240 cm room, one locked wardrobe, and one entry door. A future runtime run must
record the actual extended layout, including placement poses and validation state.

## Measured assets

The six GLB mappings were checked against
[`visual-assets.ts`](../src/features/creator/scene/visual-assets.ts). Each product occurs once.
“Primitives” counts glTF triangle primitives; it is **not a measured number of renderer draw calls**.

| Product | Asset under `public/assets/` | File bytes | Triangles | Primitives |
| --- | --- | ---: | ---: | ---: |
| Northstar half rack | `northstar-half-rack.glb` | 209,240 | 6,248 | 4 |
| Arc adjustable bench | `arc-adjustable-bench.glb` | 75,196 | 1,664 | 5 |
| Foundry bumper plates | `foundry-bumper-plates.glb` | 49,428 | 1,536 | 3 |
| Range adjustable dumbbells | `range-adjustable-dumbbells.glb` | 155,600 | 4,640 | 5 |
| Anchor pull-up bar | `anchor-pullup-bar.glb` | 38,516 | 1,104 | 4 |
| Surge compact treadmill | `surge-compact-treadmill.glb` | 81,336 | 1,868 | 7 |
| Ironvale barbell set | Intentional box fallback; no registered GLB | — | — | — |
| **GLB total** | **6 unique files** | **609,316** | **17,060** | **28** |

These are disk sizes, not browser transfer sizes or GPU allocation. Triangle totals were cross-checked
by visiting mesh instances reachable from each GLB's default scene; all six match the existing
inspection script's mesh totals. All primitives use triangle mode. These totals exclude the room
shell, obstacle, door, use zones, fallback box, selection outlines, and any shadow/render passes.

All six GLB JSON documents contain **zero image entries and zero texture entries**. Thus the source
assets carry no image textures; this does **not** mean the renderer uses zero texture memory. Shadow
maps, framebuffers and other renderer allocations still require a runtime measurement.

## Reproduction

Measurement machine: Apple M3 Pro, 18 GiB RAM, Darwin 25.4.0 arm64. Runtime: Node.js v26.7.0.
Browser/version, GPU backend and viewport: not measured; this run did not render the application.

From the repository root, the existing read-only asset inspector reproduces file sizes, triangle
counts, primitives and SHA-256 hashes:

```sh
node scripts/inspect-glb.mjs \
  public/assets/northstar-half-rack.glb \
  public/assets/arc-adjustable-bench.glb \
  public/assets/foundry-bumper-plates.glb \
  public/assets/range-adjustable-dumbbells.glb \
  public/assets/anchor-pullup-bar.glb \
  public/assets/surge-compact-treadmill.glb
```

To repeat the texture-entry check, read each GLB's JSON chunk: its byte length is the little-endian
32-bit integer at offset 12 and the JSON starts at offset 20. Count `images` and `textures`, treating
absent arrays as empty. This is source metadata inspection, not browser texture-memory reporting.

| Asset | SHA-256 |
| --- | --- |
| Northstar | `7921bc7bcf32235d806e7320e3d61bf2ae588436babcef08d4f4420d2836b22a` |
| Arc | `f40b7632895386407f46bb544c523e6b5e053c63e972c6c16ba1f989be43da36` |
| Foundry | `444fa9f5bf7d3eea766e311ec3c8104d227f57ec037f50bdf9d22dc614f3cde2` |
| Range | `41bc91442fe67442e98b83b817a1d366e30de1bcf9cdfee7ab0f9208438487e1` |
| Anchor | `6d95c5b050b0f0334f13ca222ed6dae5433e579615946ab1b4a1c391e529c111` |
| Surge | `e0588cfae4c1178d0f72843db3023a78e058594cbbf7145a409ab491220f21e3` |

## Outstanding runtime record

Use one local run once the demo fixture and suitable renderer instrumentation are available. Record
the commit, machine, browser version/GPU, CSS canvas size, device pixel ratio, and production versus
development build. Import or seed the demo extended with these three products through the normal
project path. Record loaded network assets rather than assuming the registry equals actual loads.

Measure the interval from activating the 3D tab to the first submitted frame, and separately to the
first frame with all expected GLBs loaded (fallbacks can paint first). State whether asset and module
caches were cold or warm. Capture renderer triangle and draw-call counters for a steady frame and
describe whether shadow passes are included. Record texture count and bytes only where tooling
actually reports them; Three.js texture count is not texture memory in bytes.

For orbit responsiveness, record frame-interval median/p95 and the observation duration while the
camera moves at the editor viewport. Report interaction observations separately from frame timing.
Keep those measurements as review evidence, not machine-dependent CI thresholds. The static numbers
above do not close Phase 16 task 5 or Phase 20's interactive-room exit criterion.
