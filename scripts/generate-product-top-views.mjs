import { generateGlbTopViewSvg } from "./lib/glb-top-view.mjs";

const assets = [
  ["public/assets/olympic-bench.glb", "public/assets/olympic-bench-top.svg"],
  ["public/assets/groundwork-exercise-mat.glb", "public/assets/groundwork-exercise-mat-top.svg"],
  ["public/assets/wall-mounted-punching-bag.glb", "public/assets/wall-mounted-punching-bag-top.svg"],
  ["public/assets/flex-studio-dumbbells.glb", "public/assets/flex-studio-dumbbells-top.svg"],
  ["public/assets/freestanding-dip-bars.glb", "public/assets/freestanding-dip-bars-top.svg"],
  ["public/assets/loop-cable-trainer.glb", "public/assets/loop-cable-trainer-top.svg"],
  ["public/assets/compact-dual-pulley-station.glb", "public/assets/compact-dual-pulley-station-top.svg"],
  ["public/assets/forge-kettlebell-16kg.glb", "public/assets/forge-kettlebell-16kg-top.svg"],
  ["public/assets/surge-compact-treadmill.glb", "public/assets/surge-compact-treadmill-top.svg"],
  ["public/assets/range-adjustable-dumbbells.glb", "public/assets/range-adjustable-dumbbells-top.svg"],
  ["public/assets/pivot-flat-bench.glb", "public/assets/pivot-flat-bench-top.svg"],
  ["public/assets/northstar-half-rack.glb", "public/assets/northstar-half-rack-top.svg"],
  ["public/assets/squat-rack.glb", "public/assets/squat-rack-top.svg"],
  ["public/assets/arc-adjustable-bench.glb", "public/assets/arc-adjustable-bench-top.svg"],
  ["public/assets/current-fold-bike.glb", "public/assets/current-fold-bike-top.svg"],
  ["public/assets/quarry-power-bar.glb", "public/assets/quarry-power-bar-top.svg"],
  ["public/assets/foundry-bumper-plates.glb", "public/assets/foundry-bumper-plates-top.svg"],
  ["public/assets/strength-station-composition.glb", "public/assets/strength-station-composition-top.svg"],
  ["public/assets/harbor-squat-stands.glb", "public/assets/harbor-squat-stands-top.svg"],
  ["public/assets/anchor-pullup-bar.glb", "public/assets/anchor-pullup-bar-top.svg"],
  ["public/assets/cairn-iron-plates.glb", "public/assets/cairn-iron-plates-top.svg"],
  ["public/assets/delta-change-plates.glb", "public/assets/delta-change-plates-top.svg"],
];

for (const [input, output] of assets) {
  const metrics = await generateGlbTopViewSvg(input, output);
  console.log(`Generated ${output} (${metrics.triangles} projected triangles, ${metrics.bytes} bytes)`);
}
