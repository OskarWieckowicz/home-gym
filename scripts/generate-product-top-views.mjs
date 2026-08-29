import { generateGlbTopViewSvg } from "./lib/glb-top-view.mjs";

const assets = [
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
