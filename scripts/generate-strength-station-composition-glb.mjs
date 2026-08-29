import { addGlbToComposition } from "./lib/glb-composition.mjs";
import { ProceduralGlb, writeProceduralGlb } from "./lib/procedural-glb.mjs";

const OUTPUT = process.argv[2] ?? "public/assets/strength-station-composition.glb";
const MATERIAL = { graphite: 0, orange: 1, rubber: 2, zinc: 3, steel: 4, upholstery: 5, chrome: 6, grip: 7 };
const TRANSFORM = {
  rack: { center: [0, 0, 0], rotation: [0, 0, 0] },
  bench: { center: [0, 0, 0], rotation: [0, Math.PI, 0] },
  loadedBar: { center: [0, 1.453, -0.59], rotation: [0, 0, 0] },
  sparePlates: { center: [0.95, 0, 0.35], rotation: [0, 0, 0] },
};

const model = new ProceduralGlb({
  generator: "Home Gym Creator render-only strength station composition v1",
  materials: [
    { name: "Graphite powder coat", baseColorFactor: [0.022, 0.027, 0.034, 1], metallicFactor: 0.72, roughnessFactor: 0.3 },
    { name: "Safety orange", baseColorFactor: [0.88, 0.2, 0.035, 1], metallicFactor: 0.4, roughnessFactor: 0.34 },
    { name: "Black rubber and UHMW", baseColorFactor: [0.008, 0.01, 0.013, 1], metallicFactor: 0, roughnessFactor: 0.88 },
    { name: "Zinc hardware", baseColorFactor: [0.52, 0.57, 0.62, 1], metallicFactor: 0.9, roughnessFactor: 0.23 },
    { name: "Brushed steel", baseColorFactor: [0.43, 0.47, 0.51, 1], metallicFactor: 0.95, roughnessFactor: 0.19 },
    { name: "Charcoal upholstery", baseColorFactor: [0.018, 0.019, 0.022, 1], metallicFactor: 0.01, roughnessFactor: 0.82 },
    { name: "Dark chrome shaft", baseColorFactor: [0.12, 0.14, 0.16, 1], metallicFactor: 0.94, roughnessFactor: 0.22 },
    { name: "Knurled grip bands", baseColorFactor: [0.055, 0.06, 0.065, 1], metallicFactor: 0.86, roughnessFactor: 0.42 },
  ],
});

await addGlbToComposition(model, "public/assets/squat-rack.glb", {
  ...TRANSFORM.rack,
  materialMap: [MATERIAL.graphite, MATERIAL.orange, MATERIAL.rubber, MATERIAL.zinc, MATERIAL.steel],
});
await addGlbToComposition(model, "public/assets/arc-adjustable-bench.glb", {
  ...TRANSFORM.bench,
  materialMap: [MATERIAL.graphite, MATERIAL.upholstery, MATERIAL.rubber, MATERIAL.orange, MATERIAL.zinc],
});
await addGlbToComposition(model, "public/assets/quarry-power-bar.glb", {
  ...TRANSFORM.loadedBar,
  materialMap: [MATERIAL.chrome, MATERIAL.steel, MATERIAL.graphite, MATERIAL.grip],
});
await addGlbToComposition(model, "public/assets/foundry-bumper-plates.glb", {
  ...TRANSFORM.sparePlates,
  materialMap: [MATERIAL.rubber, MATERIAL.orange, MATERIAL.steel],
});

// Four render-only bumper discs sit on the loaded bar; they are not planner entities.
for (const x of [-0.83, -0.7625, 0.7625, 0.83]) {
  const outer = Math.abs(x) > 0.8;
  const thickness = outer ? 0.06 : 0.075;
  const radius = outer ? 0.215 : 0.225;
  const center = [x, 1.48, -0.59];
  model.addCylinder({ center, length: thickness, radius, axis: "x", material: outer ? MATERIAL.rubber : MATERIAL.orange, segments: 32 });
  model.addCylinder({ center, length: thickness + 0.004, radius: 0.052, axis: "x", material: MATERIAL.steel, segments: 32 });
}

await writeProceduralGlb(model, OUTPUT);
