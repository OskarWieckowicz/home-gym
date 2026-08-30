# Compact dual-pulley station — standalone model

Date: 30 August 2026. User approved generating the 3D model after the catalog concept,
at the detail level of the other procedural assets, not photographic detail.

Status: complete for the standalone model slice. GLB, derived top SVG, front/rear previews,
reproducibility tests and validation are recorded in [model provenance](../docs/COMPACT_DUAL_PULLEY_MODEL.md).
The subsequent user-authorized catalog integration is tracked in [its own plan](compact-dual-pulley-integration.md);
the scope below records the original model-only slice.

## Scope and working specification

- Separate fictional Compact Dual-Pulley Station; do not reuse Loop identity or dimensions.
- Model envelope: width 160 cm, depth 100 cm, height 220 cm. These are authored design
  assumptions, not dimensions inferred or measured from the reference photograph.
- Floor-centred metres, floor at Y=0, exercise front at negative Z.
- Complete frame with splayed feet, two adjustable front pulley carriages and handles,
  two simplified rear stacks in a shared enclosure, multi-grip upper pull-up bar.
- Graphite frame, brushed metal rails/fasteners, black cables/grips, small orange knobs.
- Static presentation mesh; no moving parts, textures, engineering certification, load
  rating or precise resistance-ratio claim. Hidden cable routing is simplified.
- Future placement assumption: floor standing with required floor anchoring; not a wall
  attachment. Provisional working zones: 180 cm front, 60 cm each side, 20 cm rear;
  245 cm minimum ceiling. These are fictional planning assumptions, not safety guidance,
  and are not applied to the domain/catalog in this model-only slice.
- Catalog identity, commercial specification and actual product integration remain a
  separate step. No existing IDs, placements, prices, rules or image mappings change.

## Implementation and acceptance

1. Reuse ProceduralGlb and material merging; produce a deterministic generator and GLB.
   Keep the generator under 500 lines, the GLB below 1 MB and geometry below 18,000
   triangles with at most six material primitives, comparable to existing equipment.
2. Derive the top view from the GLB through the existing pipeline. Render offline front
   and rear PNG previews and inspect both for connected structure and clear silhouette.
   Preserve the browser-review pause.
3. Test deterministic regeneration against the shipped GLB, dimensions, floor origin,
   materials/normals, asset budgets and reproducibility of the derived top view.
4. Record source image, generation commands, metrics and review limitations in provenance.
5. Run focused asset tests, quality:quick, lint:report and agent:verify. No runtime,
   Next.js or deployment configuration change is planned, so a build is not required.
