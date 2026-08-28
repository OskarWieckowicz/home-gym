# Product visuals strategy

> Status: accepted direction for Phases 12–14.  
> Updated: 28 August 2026.

## Purpose

Home Gym Creator needs three visual representations of a catalog product:

1. a catalog image for browsing and product details,
2. a transparent top-down representation for the primary 2D editor,
3. a simplified spatial representation for the 3D room preview.

These representations should look related, remain inexpensive to produce, and never become the
source of truth for spatial calculations. Product dimensions, placement, clearance, collisions,
height checks, and budget validation continue to come from the deterministic catalog and project
domain.

## Core decision

Use a small library of parameterized, procedural 3D equipment families as the primary visual
source. Reuse each family across products by applying catalog dimensions, selected structural
variants, and restrained material or color options.

From the same procedural representation, produce:

- the live equipment shown in the 3D room preview,
- an orthographic top-down render for the 2D editor,
- a consistent three-quarter render for the catalog when its quality is sufficient.

Use AI image generation selectively to enhance catalog presentation, not to generate every visual
representation independently. This avoids paying for multiple unrelated generations per product
and reduces visual drift between the catalog, 2D editor, and 3D room.

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

Prefer a deterministic three-quarter render from the procedural model for the complete catalog.
Use a consistent camera, background, lighting rig, shadow treatment, crop, and product orientation.
This gives every product a usable image without a per-image generation service.

AI-generated or AI-edited images are reserved for cases where they materially improve the public
presentation, such as:

- featured catalog products,
- landing-page hero products,
- a small number of visually weak procedural renders.

Do not include real manufacturer logos, copied product designs, embedded text, room backgrounds, or
visual dimensions that contradict the catalog record. Store the accepted prompt, reference assets,
and revision notes so a product image can be recreated consistently.

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

Build equipment from low-complexity primitives and reusable subassemblies in React Three Fiber and
Three.js. Typical pieces include boxes, cylinders, rails, uprights, pads, plates, handles, and
consoles. The goal is recognizable structure and useful spatial scale, not manufacturing detail.

The 3D representation must:

- use the same project placement and rotation as the 2D plan,
- remain within the canonical stored dimensions within a documented visual tolerance,
- render efficiently when a complete demo room is visible,
- support selection and validation highlighting,
- avoid being used for collision or clearance calculations.

Exported GLTF or GLB assets are optional. Prefer code-driven components while the number of visual
families is small and dimensions must remain parameterized. Reconsider exported assets only when a
specific model is too complex or slow to maintain procedurally.

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
3. Prototype only three representative products: a rack, an adjustable bench, and a treadmill.
4. Approve the modeling style, catalog camera, top-down camera, materials, and naming convention.
5. Expand reusable visual families before creating product-specific exceptions.
6. Render catalog and top-down outputs locally from the procedural models.
7. Use AI generation only after reviewing the complete deterministic set and identifying specific
   presentation gaps.
8. Generate or edit AI images in a small review batch before authorizing the remaining products.
9. Record the current service pricing or included-usage impact immediately before a large batch;
   do not preserve a monetary estimate as a permanent architectural fact.

Codex and ChatGPT's built-in image generation currently use GPT Image and consume included Codex
usage faster than comparable non-image turns. OpenAI recommends using the API for larger batches so
API pricing applies. Availability, usage multipliers, models, and prices are time-sensitive and
must be checked again when Phase 13 begins.

## Phase ownership

### Phase 12 — Equipment placement foundation

- Add equipment placement using deterministic geometric figures only.
- Complete selection, movement, rotation, removal, collision, clearance, height, budget,
  undo/redo, persistence, and import/export behavior without depending on final visuals.
- Keep the geometric figure as a permanent missing-asset fallback and keep asset lookup independent
  from placement commands.
- Do not produce final product imagery, top-down assets, or 3D equipment models in this phase.

### Phase 13 — Product visual assets and models

- Finalize the visual metadata contract and visual-family mapping.
- Build and verify the reusable procedural 3D product families.
- Produce and integrate the top-down editor assets.
- Produce the deterministic catalog renders.
- Use AI generation or editing only for approved presentation gaps.
- Optimize files and verify explicit missing-asset fallbacks.

### Phase 14 — 3D room preview

- Integrate the completed Phase 13 procedural families into the live room scene rather than
  starting a second model-production path.
- Build the shared-state 3D room preview and 2D/3D switch.
- Add navigation, selection, and validation presentation.
- Verify representative complete-room performance and spatial readability.

### Phase 17 — Landing page and catalog polish

- Use accepted final assets and real screenshots from the completed shared-editing demo.
- Do not reopen the model-production scope unless a visible presentation defect blocks the surface.

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
