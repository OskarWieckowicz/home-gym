# Product visuals strategy

> Status: AI-first production approach accepted; Phase 15 validates the rack in the application.
> Updated: 29 August 2026.

## Purpose

Home Gym Creator needs three visual representations of a catalog product:

1. a catalog image for browsing and product details,
2. a transparent top-down representation for the primary 2D editor,
3. a simplified spatial representation for the 3D room preview.

These representations should look related, remain inexpensive to produce, and never become the
source of truth for spatial calculations. Product dimensions, placement, clearance, collisions,
height checks, and budget validation continue to come from the deterministic catalog and project
domain.

## Core production decision

Use AI-generated procedural GLB as the primary source for a small library of coherent equipment
families. Keep each accepted generator script with its output so the asset can be reproduced,
reviewed, and revised without a manual Blender workflow. Generation is an offline production step,
not a runtime application feature.

From each accepted GLB produce:

- the live equipment shown in the 3D room preview,
- an orthographic top-down render for the 2D editor,
- a deterministic three-quarter base render for the catalog.

Use AI image editing to polish the catalog render when it materially improves presentation. The
edited result may add surface detail, lighting, and commercial finish, but must preserve the same
recognizable product, orientation, silhouette, and structural parts. Do not generate catalog
images independently from an unrelated text prompt.

Sketchfab and other licensed libraries are fallback sources only when a difficult equipment family
cannot meet the quality bar through the primary pipeline. A sourced model is accepted only when its
license, attribution, public-repository rights, and cleanup cost are clear.

## Decision evidence

GPT-5.6 sol produced the first accepted real-asset benchmark:

- `scripts/generate-squat-rack-glb.mjs` generates a real glTF 2.0 binary asset at real-world scale;
- `public/assets/squat-rack.glb` is approximately 532 KB, 11,560 triangles, 251 mesh nodes, and five
  materials;
- `public/assets/squat-rack-catalog.png` demonstrates the accepted catalog art direction;
- the result is recognizable and materially stronger than the discarded pseudo-isometric SVG.

The benchmark proves that an LLM-authored procedural generator can produce a useful real mesh and
a strong catalog presentation without Blender. It does not yet prove that the approach works for
an adjustable bench or more organic cardio equipment. The rack also has too many separate mesh
nodes for a production family, so automated geometry merging or instancing remains part of the
pipeline.

## Lesson from the discarded prototype

The first attempted Phase 14 implementation generated normalized box and cylinder recipes in code
and projected them directly into pseudo-isometric SVG catalog illustrations. It was discarded after
visual review. The approach failed because:

- it never produced or inspected a real mesh in a perspective-lit 3D environment;
- family construction, art direction, camera, materials, catalog rendering, and 2D projection were
  scaled together before one benchmark had been approved;
- simple rails made racks barely readable, but benches and more organic equipment exposed the lack
  of structural detail immediately;
- deterministic bounds tests proved only that primitives fit an envelope, not that the object
  resembled the intended product;
- code and DOM tests could not substitute for visual acceptance at actual card and editor sizes.

An isometric SVG or a collection of rectangles is no longer accepted as evidence that the 3D
modeling pipeline works.

## Visual families

The 32-product catalog should not require 32 unique meshes. Start with approximately 8–12 reusable
families, selected after Phase 11 fixes the final product range. Likely families include:

- full rack and half rack,
- flat bench and adjustable bench,
- barbell,
- weight plates,
- dumbbells with a storage rack,
- treadmill,
- bike, rower, or other compact cardio frame,
- freestanding accessory,
- wall-mounted accessory.

Products that do not materially occupy room space do not need an individual placeable 3D model.
They may remain visible in the catalog and shopping summary without appearing as independent room
objects.

## Product visual contract

Each product keeps commercial and spatial data in the existing catalog schema. Visual metadata
selects a renderer without duplicating physical dimensions.

An illustrative contract is:

```ts
type ProductVisuals = {
  family: ProductVisualFamily;
  variant?: string;
  frameColor?: string;
  accentColor?: string;
  upholsteryColor?: string;
  catalogImage?: string;
  topViewImage?: string;
};
```

The renderer receives the canonical product dimensions separately. A visual asset may be cropped,
stylized, or simplified, but its displayed footprint must be scaled from those dimensions rather
than inferred from image pixels or mesh bounds.

## Catalog images

Start with a deterministic three-quarter render from the procedural GLB for the complete catalog.
Use a consistent camera, background, lighting rig, shadow treatment, crop, and product orientation.
This gives every product a usable image without a per-image generation service.

Use controlled AI image editing where it materially improves the public presentation, such as:

- featured catalog products,
- landing-page hero products,
- a small number of visually weak procedural renders.

The GLB render must be the visual reference supplied to the edit. Reject an edit that changes the
equipment family, removes required structure, invents incompatible attachments, or materially
changes its proportions. Do not include real manufacturer logos, copied product designs, embedded
text, room backgrounds, or visual dimensions that contradict the catalog record. Store the base
render, accepted prompt, model name, and revision notes.

## Top-down 2D visuals

Generate top-down visuals from an orthographic camera looking at the same procedural equipment used
by the 3D preview. The output should have:

- a transparent background,
- a canonical forward direction,
- consistent neutral lighting,
- tight but non-clipping bounds,
- no baked-in selection state, labels, dimensions, clearance, or warning colors.

The editor remains responsible for selection outlines, resize or rotation handles, collision
states, and translucent use or safety zones. If pre-rendered top-down assets are not ready, Phase 12
uses a deterministic geometric fallback so placement work is never blocked by asset production.

## Simplified 3D equipment

Generate each family through a reproducible script that writes an actual GLB. The script may use
low-complexity primitives and reusable subassemblies, but its output must be reviewed with
perspective, lighting, and multiple camera angles. React Three Fiber and Three.js remain runtime
adapters rather than the source of domain geometry. The goal is recognizable structure and useful
spatial scale, not manufacturing detail.

The 3D representation must:

- use the same project placement and rotation as the 2D plan,
- remain within the canonical stored dimensions within a documented visual tolerance,
- render efficiently when a complete demo room is visible,
- avoid excessive draw calls by merging static geometry per material or instancing repeated parts,
- support selection and validation highlighting,
- avoid being used for collision or clearance calculations.

GLB is the required runtime artifact. Keep the generator script, prompt or task brief, measured
dimensions, material definitions, optimization record, and accepted review renders with the asset.

## 3D room preview

The 3D preview reuses the same project store as the 2D editor. It shows the floor, walls, openings,
physical obstacles, and simplified equipment with a perspective camera, orbit controls, and zoom.
The primary implementation is a full 2D/3D view switch. A simultaneous miniature 3D preview inside
the 2D layout is an optional enhancement after the full view passes its exit gate.

The preview exists to inspect ceiling clearance, crowding, wall relationships, and general room
legibility. Precise editing remains in 2D.

## Cost-control workflow

1. Complete Phase 11 before producing the full asset set so stable product IDs and categories are
   known.
2. Implement Phase 12 placement with replaceable geometric fallbacks.
3. Keep the accepted squat-rack generator and catalog image as the baseline evidence.
4. Build the Phase 15 read-only 3D scene shell and load the rack from the existing project state.
5. Verify scale, pivot, orientation, loading, fallback behavior, and runtime cost in a real room.
6. Start Phase 16 with the harder Arc Adjustable Bench family and review it inside the scene shell.
7. Generate the bench's top-down and catalog base renders plus one controlled AI-edited catalog
   result, then measure visual quality, dimensions, mesh/draw-call cost, file size, and reproducibility.
8. If the bench passes, expand in small reviewed batches to treadmill, weights, and the remaining
   reusable families. If one family fails, use a licensed sourced model only for that exception.
9. Record model/tool versions, prompts, inputs, output rights, and current cost immediately before
   a larger batch. Do not preserve a monetary estimate as a permanent architectural fact.

Codex and ChatGPT's built-in image generation currently use GPT Image and consume included Codex
usage faster than comparable non-image turns. OpenAI recommends using the API for larger batches so
API pricing applies. Availability, usage multipliers, models, and prices are time-sensitive and
must be checked again during Phase 16 before any paid generation or acquisition.

## Phase ownership

### Phase 12 — Equipment placement foundation

- Add equipment placement using deterministic geometric figures only.
- Complete selection, movement, rotation, removal, collision, clearance, height, budget,
  undo/redo, persistence, and import/export behavior without depending on final visuals.
- Keep the geometric figure as a permanent missing-asset fallback and keep asset lookup independent
  from placement commands.
- Do not produce final product imagery, top-down assets, or 3D equipment models in this phase.

### Phase 14 — Product visual feasibility decision

- Treat the accepted squat-rack artifacts as proof of the AI-generated procedural GLB direction.
- Record the AI-first decision, discarded SVG lesson, and licensed-source fallback.

### Phase 15 — 3D scene shell and squat-rack vertical slice

- Add a read-only R3F room driven by the same project store as the SVG plan and WebMCP.
- Load the real squat-rack GLB for the Summit Power Cage.
- Render obstacles and unmodeled equipment with deterministic geometric fallbacks.
- Verify coordinates, scale, pivot, orientation, loading, and runtime cost before producing more models.

### Phase 16 — Product visual assets and models

- Finalize the visual metadata contract and visual-family mapping.
- Start with the Arc Adjustable Bench as the difficult-family gate in the Phase 15 scene shell.
- Produce and verify AI-generated procedural GLB families using the approved pipeline.
- Produce and integrate the top-down editor assets.
- Produce the deterministic catalog renders.
- Use controlled AI editing of GLB-derived catalog renders for approved presentation polish.
- Optimize files and verify explicit missing-asset fallbacks.

### Phase 20 — 3D room preview implementation (closed)

- Integrate the completed Phase 16 equipment assets into the live room scene rather than
   starting a second model-production path.
- Extend the Phase 15 shell with selection and validation presentation.
- Runtime performance and spatial-readability acceptance remain in Phase 16 tasks 4–5;
  see [performance notes](PERFORMANCE_NOTES.md) for measured data and outstanding checks.

### Phase 23A — Landing page polish

- Follow the [process-first landing specification](LANDING_PAGE.md) and its accepted v2 reference.
- Use real editor captures to show the same room from empty geometry through goals/budget to a
  furnished layout. The completed demo may supply imagery but is not the page's narrative.
- Do not reopen the model-production scope unless a visible presentation defect blocks the surface.

### Phase 23B — Catalog polish

- Keep product images and intentional fallbacks consistent across catalog cards and detail pages.
- Use Phase 16 asset coverage decisions without expanding the approved photo-generation queue.

## Acceptance principles

The strategy is successful when:

- all placeable MVP products have a clear 2D representation and a recognizable 3D representation;
- all catalog products have a coherent product image or an intentional fallback;
- the same stored product dimensions and placement drive both editor views;
- missing or failed visual assets cannot break editing or validation;
- no product requires AI-generated catalog, 2D, and 3D assets as three independent deliverables;
- a rack, bench, treadmill, and dumbbell storage setup resembles the editor mockup closely enough
  to communicate the intended product without photorealistic rendering;
- the final asset set remains fast enough for the public demo and small enough for practical web
  delivery.

## Current external references

These references were checked on 28 August 2026 and must be rechecked before batch generation:

- [OpenAI image generation in Codex and ChatGPT](https://learn.chatgpt.com/docs/image-generation)
- [GPT Image model documentation](https://developers.openai.com/api/docs/models/gpt-image-2)
- [OpenAI API pricing](https://developers.openai.com/api/docs/pricing)
