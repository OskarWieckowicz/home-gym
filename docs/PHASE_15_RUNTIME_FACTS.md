# Phase 15 runtime facts

The accepted `public/assets/squat-rack.glb` is loaded only for the explicit
`product_summit_power_cage` registry entry. The generator creates 251 mesh nodes
and five materials. The model uses a floor pivot at `y = 0`, negative Z as its
forward direction, and is normalized in the scene to the catalog envelope of
130 × 165 × 225 cm. The generated model is authored at approximately 1.28 ×
1.58 × 2.25 m; the scene applies a small X/Z envelope correction (`1.016`,
`1.04`) to account for the authored structural bounds.

The GLB is a single binary asset with one primitive per mesh node. Observed
runtime draw calls are therefore approximately 251 for one rack instance,
subject to Three.js material/program batching. Loading is client-only and is
wrapped in an asset-local error boundary; an invalid or failed load renders the
same catalog-dimension cuboid used by every unregistered product. The current
implementation does not derive validation or collision state from rendered
meshes.
