# Align equipment visuals with domain fronts

## Finding

The domain is internally consistent: at rotation 0, the front use zone extends toward +Z;
at 90/180/270 it points toward -X/-Z/+X. GLBs and their raw SVG projections are authored
with forward at -Z. The renderers incorrectly applied the stored rotation directly (3D)
or its negative (SVG), so fronts are reversed at 0/180 and asymmetric sides rotate incorrectly.

## Implementation

1. Keep all catalog clearances, domain rotations, saved projects, and generated models unchanged.
2. Add one presentation-only orientation adapter: GLB yaw = 180 degrees minus domain rotation.
   SVG rotation is the inverse yaw; translate into the physical bounding rectangle as before.
3. Use it in both equipment renderers, including the wall-mounted accessory.
4. Test all four rotations against asymmetric domain margins and actual Northstar front geometry;
   verify wall-mount backplates face the implied wall and preserve SVG footprint bounds.
5. Run focused tests, quality:quick, lint:report, agent:verify and production build. Review changes
   with a reviewer, then verify 2D/3D visually in the isolated test room without editing user data.

## Evidence

Implemented on 30 August 2026. This corrects presentation, not collision rules or clearance dimensions.

- Both renderers now use `equipmentVisualRotation`; all accepted -Z assets receive the correction.
- 26 focused tests passed, including the actual GLB safety-arm geometry under all four rotations,
  70 cm front-zone alignment, SVG bounds/transforms, and mounted-wall back direction.
- `quality:quick`, `agent:verify` (74 files / 528 tests), production `build`, and `git diff --check`
  passed. `lint:report`: 0 errors / 29 advisory warnings, no new warnings from this fix.
- Read-only reviewer found no actionable issues. React checklist: no new effects, subscriptions,
  dependencies, state, fetching, or event-handler changes; existing asset error boundaries retained.
- Production browser review confirms the 70 cm zone is on the safety-arm side in both views:
  [2D evidence](evidence/northstar-use-zone-2d.png), [3D evidence](evidence/northstar-use-zone-3d.png).
  Existing pose (rotation 180) and saved project data were left unchanged. Browser reported no
  errors, only the existing Three.Clock deprecation warning. Isolated local preview remains on 3001.
- The test room still has the expected no-door access warning; this review does not approve its layout.
- Remaining non-blocking coverage: the wall-backplate test uses the authored +Z direction rather
  than loading Anchor's actual geometry; the final ScenePreview primitive yaw is visually reviewed,
  while unit tests cover the shared adapter directly.
- The modern-web-guidance package was not cached, and auto-review rejected downloading/executing it.
  No workaround was used. Local Next.js documentation, Three.js behavior, domain code, regression
  tests, and browser review supplied the necessary verification instead.
