# Landing page capture provenance

Captured 30 August 2026 from the running local Home Gym Creator at `http://localhost:3100/creator`.
Base revision: `6f9c16c2298a0e37d13150624c0515d52df42ddc`; working-tree changes at capture time
only affect landing/shared marketing chrome, not the creator or geometry.

## Source and permitted use

Own application screenshots, distributed with this repository under its [MIT license](../LICENSE).
The equipment is the project's existing fictional catalog and accepted/generated visual assets;
no stock photo, third-party screenshot or generated full-page mockup is embedded here. The source
room is the checked-in [demo fixture](../src/features/project/fixtures/demo-project.json).

All assets live under `public/images/landing/`, are 1040 × 780 WebP and are rendered with `next/image`.
Captured at desktop viewport 1664 × 960. Full viewport screenshots were cropped using Sharp
because the browser's clipped screenshot output was scaled incorrectly. Only cropping, uniform
resizing for the goals crop, and WebP compression were applied. No retouching, synthetic controls
or replacement equipment imagery was added.

| File | Actual state and crop (left, top, width, height) |
| --- | --- |
| `layout.webp` | Bundled demo in default editable 3D; crop (304, 136, 1040, 780), quality 88. |
| `room.webp` | New empty project, same dimensions/wardrobe/door reconstructed through WebMCP; crop (304, 136, 1040, 780), quality 88. |
| `goals.webp` | Same empty room with budget 10000 and strength/muscle-gain goals, Room → Project settings visible; crop (800, 136, 864, 648), resized to 1040 × 780, quality 90. |
| `shared-editing.webp` | Bundled demo switched to 2D, Northstar Half Rack selected manually; crop (304, 169, 1040, 780), quality 88. |

Empty state recipe: room 400 × 320 × 240 cm; locked Wardrobe 80 × 60 × 220 cm at x=300, z=0,
rotation 0; Entry door on top wall at offset 195 cm, width 90 cm. No project items or placements.
This reproduces the demo's room/obstacles without changing production fixtures or user project data.
The goals capture is a real configuration example, not a prescribed budget in the landing narrative.
It documents the 30 August UI: settings have since moved from Room into a modal opened through
Project → Settings or the direct budget/goals actions. The capture provenance above remains historical.

## Truthfulness and limitations

The furnished scene has no validation errors and five warnings in the current engine. Amber zones
are genuine overlapping exercise areas. Existing geometric equipment fallbacks and simplified
wardrobe/door rendering are visible; this work does not reopen Phase 16 model production.
The screenshots show actual prototype capability, not the photorealistic generated mockup.

The hero loads eagerly with high fetch priority; ordinary below-fold images use lazy loading at
normal priority, following the modern-web-guidance image-priority guide and installed Next.js
16.3.3 image documentation. The full-page v2 mockup stays a documentation-only design reference.
