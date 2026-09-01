# Landing page asset provenance

## Hero room concept

Added 31 August 2026 from the user-provided source
`Codex Image Aug 31, 2026, 11_33_46 PM.png` (1189 × 1323 PNG, 2,322,393 bytes).
The filename and delivery context identify it as an AI-generated Codex image. The original generation
prompt and reference inputs were not provided to the repository. The user supplied the image
specifically for hero use; no broader third-party licensing claim is made here.

`hero-room-concept.webp` is a 1040 × 780 WebP. The source was auto-oriented, resized to 1040 px
wide, cropped at `(0, 110, 1040, 780)` in the resized image, stripped of metadata, and encoded at
WebP quality 82. No objects, controls or product claims were added. Its visible caption identifies it
as **AI-generated room concept — illustrative, not an app render**. It communicates the small-room
planning problem only; it is not evidence of editor output, photo reconstruction, validated geometry
or safety certification.

## Product captures

The `room-with-obstacles.webp` and `equipment-arrangement.webp` process captures were refreshed on 1 September 2026
from screenshots supplied by the user specifically for the landing page:

- `Zrzut ekranu 2026-09-1 o 09.01.50.png` (1752 × 1172) is the empty-room state.
- `Zrzut ekranu 2026-09-1 o 09.01.36.png` (1744 × 1166) is the arranged-equipment state.

Both sources were centre-cropped to 4:3, resized to 1040 × 780, stripped of metadata and
encoded as WebP at quality 88. They are own application screenshots; no controls, objects or
validation states were added.

`goals-budget-symbolic.webp` was generated on 1 September 2026 with the built-in Codex image
generation tool, using `room-with-obstacles.webp` as the edit target. The prompt required the room,
camera, door, window and obstacles to remain recognizable while adding a restrained editorial card
with goal and budget symbols. The result was centre-cropped to 4:3, resized to 1040 × 780 and encoded
as WebP at quality 88. It is an illustrative planning bridge, not a capture of product controls.

Captured 30 August 2026 from the running local Home Gym Creator at `http://localhost:3100/creator`.
Base revision: `6f9c16c2298a0e37d13150624c0515d52df42ddc`; working-tree changes at capture time
only affect landing/shared marketing chrome, not the creator or geometry. This capture context
continues to apply to the historical, currently unused `goals.webp`.

## Source and permitted use

Own application screenshots, distributed with this repository under its [MIT license](../LICENSE).
The equipment is the project's existing fictional catalog and accepted/generated visual assets;
no stock photo, third-party screenshot or generated full-page mockup is embedded here. The source
room is the checked-in [demo fixture](../src/features/project/fixtures/demo-project.json).

The product captures live under `public/images/landing/`, are 1040 × 780 WebP and are rendered with
`next/image`. Captured at desktop viewport 1664 × 960. Full viewport screenshots were cropped using Sharp
because the browser's clipped screenshot output was scaled incorrectly. Only cropping, uniform
resizing for the goals crop, and WebP compression were applied. No retouching, synthetic controls
or replacement equipment imagery was added.

| File | Actual state and crop (left, top, width, height) |
| --- | --- |
| `equipment-arrangement.webp` | User-supplied arranged room screenshot; centred 4:3 crop, resized to 1040 × 780, quality 88. |
| `room-with-obstacles.webp` | User-supplied empty room screenshot; centred 4:3 crop, resized to 1040 × 780, quality 88. |
| `goals-budget-symbolic.webp` | AI-generated editorial overlay on the empty-room capture; centred 4:3 crop, resized to 1040 × 780, quality 88. |
| `goals.webp` | Same empty room with budget 10000 and strength/muscle-gain goals, Room → Project settings visible; crop (800, 136, 864, 648), resized to 1040 × 780, quality 90. |

Empty state recipe: room 400 × 320 × 240 cm; locked Wardrobe 80 × 60 × 220 cm at x=300, z=0,
rotation 0; Entry door on top wall at offset 195 cm, width 90 cm. No project items or placements.
This reproduces the demo's room/obstacles without changing production fixtures or user project data.
The goals capture is a real configuration example, not a prescribed budget in the landing narrative.
It documents the 30 August UI: settings have since moved from Room into a modal opened through
Project → Settings or the direct budget/goals actions. The capture provenance above remains historical.

## Truthfulness and limitations

The arranged-room capture does not show validation overlays and should not be read as evidence that
the visible arrangement passes geometry checks. Existing geometric equipment fallbacks and simplified
room-object rendering are visible; this work does not reopen Phase 16 model production. The screenshots
show actual prototype output. The separate hero concept is not prototype evidence.

The hero concept loads eagerly with high fetch priority; ordinary below-fold product captures use
lazy loading at normal priority, following the modern-web-guidance image-priority guide and installed
Next.js 16.3.3 image documentation. Every image reserves its 1040 × 780 aspect ratio and declares
responsive sizes. The full-page v2 mockup stays a documentation-only design reference.
