# Phase 15 runtime facts

The accepted `public/assets/squat-rack.glb` is loaded only for the explicit
`product_summit_power_cage` registry entry. Phase 16 replaced the original 251-node benchmark with
an accepted five-node, per-material merged revision without changing its silhouette or mapping.
The model uses a floor pivot at `y = 0` and negative Z as its forward direction. Its measured
geometry is approximately 1.32 × 1.74 × 2.27 m (width × depth × height). The scene retains the
Phase 15 X/Z display scale (`1.016`, `1.04`) to preserve the accepted appearance; this is not an
exact normalization to the 130 × 165 × 225 cm catalog envelope, which remains domain truth.

The GLB is a single binary asset with five material-group primitives, reducing the rack's
draw-call proxy from 251 to five. Loading is client-only and is
wrapped in an asset-local error boundary; an invalid or failed load renders the
same catalog-dimension cuboid used by every unregistered product. The current
implementation does not derive validation or collision state from rendered
meshes.

## Exit-gate acceptance

Phase 15 was accepted on 29 August 2026. The acceptance included:

- `npm run agent:verify`: passed with 52 test files and 379 tests;
- `npm run build`: passed with the `/creator` production route generated successfully;
- manual desktop verification of the 2D/3D switch, the Summit Power Cage GLB, a catalog-sized
  fallback placement, orbit controls, and zoom;
- manual verification at a 430 × 900 px viewport with no framework error overlay.

The acceptance treats the existing structural and unit-test evidence as sufficient for this
vertical slice. Additional component coverage for forced GLB/WebGL failure and a dedicated
two-adapter shared-placement integration test remain desirable follow-up hardening, but they do
not block Phase 16.
