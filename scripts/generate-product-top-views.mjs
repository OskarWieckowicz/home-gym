import { generateGlbTopViewSvg } from "./lib/glb-top-view.mjs";

const assets = [
  ["public/assets/squat-rack.glb", "public/assets/squat-rack-top.svg"],
  ["public/assets/arc-adjustable-bench.glb", "public/assets/arc-adjustable-bench-top.svg"],
  ["public/assets/quarry-power-bar.glb", "public/assets/quarry-power-bar-top.svg"],
  ["public/assets/foundry-bumper-plates.glb", "public/assets/foundry-bumper-plates-top.svg"],
];

for (const [input, output] of assets) {
  const metrics = await generateGlbTopViewSvg(input, output);
  console.log(`Generated ${output} (${metrics.triangles} projected triangles, ${metrics.bytes} bytes)`);
}
