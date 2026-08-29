# Product visual pipeline — decision record

> Decision: accepted on 29 August 2026.

## Decision

Home Gym Creator will use:

> **AI-generated procedural GLB as the primary 3D asset source, an AI-edited render as the catalog
> image, and Sketchfab or another licensed library only as a fallback.**

Generation is an offline asset-production workflow. The deployed application does not call a model
to create equipment at runtime.

Each accepted equipment family keeps:

- a fixed product brief based on canonical catalog dimensions;
- a reproducible generator script;
- a real glTF 2.0 Binary (`.glb`) artifact;
- deterministic perspective and transparent top-down review renders;
- a deterministic catalog base render;
- the prompt, input render, model/tool version, and revision notes for any AI image edit;
- measured size, triangle count, node/mesh count, materials, and draw-call implications.

The GLB supplies the live 3D preview and top-down editor visual. The catalog image starts from a
render of that GLB and may be polished with AI, but the edit must not turn it into a different
product.

## Evidence

GPT-5.6 sol generated the initial accepted squat-rack benchmark:

- [`scripts/generate-squat-rack-glb.mjs`](../scripts/generate-squat-rack-glb.mjs) produces a real
  GLB at real-world scale without Blender;
- [`public/assets/squat-rack.glb`](../public/assets/squat-rack.glb) is approximately 532 KB with
  11,560 triangles, 251 mesh nodes, and five materials;
- [`public/assets/squat-rack-catalog.png`](../public/assets/squat-rack-catalog.png) established an
  acceptable catalog quality and art direction.

This result demonstrated that the earlier failure was not caused by procedural generation itself.
The discarded prototype stopped at direct pseudo-isometric SVG projections and never produced or
reviewed a real mesh in a lit perspective scene. The accepted experiment produces an inspectable
GLB and separates 3D asset generation from catalog presentation.

## Remaining feasibility gates

A squat rack is favorable to procedural construction because it is mostly rails, boxes, and
cylinders. Before producing a harder family, the accepted rack must be loaded into a minimal
shared-state 3D room. This proves the application path: GLB loading, scene coordinates, pivot,
orientation, scale, fallback solids, and runtime cost.

After the scene shell passes, the next model-production benchmark is the Arc Adjustable Bench,
whose pads, hinge, inclined back, feet, and support structure expose weak geometry more clearly.

The pipeline is authorized for batch production only after that bench passes:

- perspective review from multiple angles;
- transparent orthographic top-down readability;
- structural consistency between GLB and AI-edited catalog image;
- reproducibility without Blender;
- measured size, triangle, mesh, material, and draw-call cost.

The current rack's triangle count and file size are acceptable for a benchmark, but 251 separate
mesh nodes are too many for an efficient production family. The generator pipeline must merge
static geometry by material or instance repeated parts before scaling to complete rooms.

## Why ready-made libraries are fallback only

Research found usable gym models on Sketchfab, including CC BY packs, benches, racks, cardio, and
weights. The route is legally possible, but it adds recurring work:

1. find a visually suitable downloadable model;
2. verify the exact license, author, attribution, branding, and public-repository rights;
3. inspect formats, scale, materials, polygon count, and object separation;
4. clean, normalize, and often convert the asset in Blender;
5. reconcile inconsistent styles across multiple authors.

That cost is disproportionate while the reproducible AI-generated route is meeting the quality
bar. Do not maintain a large marketplace shortlist. Search external libraries only for a specific
family after the primary pipeline has failed its timeboxed benchmark.

For a fallback in the public hackathon repository, prefer CC0 or CC BY 4.0 without logos. Record
the author, direct URL, license version, acquisition date, required attribution, and modifications.
Reject NonCommercial, NoDerivatives, editorial-only, unclear, or marketplace Royalty Free assets
that do not explicitly permit public redistribution of the derived GLB.

## Production rules

- The catalog and project domain remain the source of truth for dimensions, footprint, clearance,
  collisions, rotation, height checks, and validation.
- Never infer placement geometry from mesh bounds or image pixels.
- Keep the existing geometric editor representation as a permanent missing-asset fallback.
- Produce approximately 8–12 reusable visual families rather than 32 unrelated meshes.
- Do not accept a model from code inspection alone; review the real GLB with perspective and light.
- Do not accept a catalog image on aesthetics alone; compare its structural parts with the GLB.
- Do not add logos, real manufacturer designs, embedded text, or unrelated room backgrounds.
- Keep generation and image editing in small review batches.
- Record the tool/model version and current output-rights terms before a production batch.

## Next step

Execute Phase 15 as a read-only shared-state 3D room with the Summit Power Cage using the accepted
squat-rack GLB and cuboid fallbacks for everything else. Then start Phase 16 with the Arc Adjustable
Bench gate. If the bench fails, retain the AI-generated approach for simpler families and source
only the failing family under a verified CC0 or CC BY license.
