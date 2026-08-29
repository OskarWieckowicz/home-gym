import { addOlympicSleeve } from "./lib/equipment-parts.mjs";
import { ProceduralGlb, writeProceduralGlb } from "./lib/procedural-glb.mjs";

const OUTPUT = process.argv[2] ?? "public/assets/quarry-power-bar.glb";
const MATERIAL = { shaft: 0, sleeve: 1, collar: 2, grip: 3 };
const model = new ProceduralGlb({
  generator: "Home Gym Creator Quarry Power Bar generator v1",
  materials: [
    { name: "Dark chrome shaft", baseColorFactor: [0.12, 0.14, 0.16, 1], metallicFactor: 0.94, roughnessFactor: 0.22 },
    { name: "Brushed steel sleeves", baseColorFactor: [0.42, 0.46, 0.5, 1], metallicFactor: 0.96, roughnessFactor: 0.18 },
    { name: "Graphite collars", baseColorFactor: [0.025, 0.03, 0.038, 1], metallicFactor: 0.78, roughnessFactor: 0.3 },
    { name: "Knurled grip bands", baseColorFactor: [0.055, 0.06, 0.065, 1], metallicFactor: 0.86, roughnessFactor: 0.42 },
  ],
});

// Canonical 2.20 × 0.05 × 0.05 m envelope. The bar lies on the floor along X.
const centerY = 0.027;
model.addCylinder({ center: [0, centerY, 0], length: 1.31, radius: 0.014, axis: "x", material: MATERIAL.shaft, segments: 24 });
for (const x of [-0.8975, 0.8975]) {
  addOlympicSleeve(model, {
    center: [x, centerY, 0],
    length: 0.405,
    sleeveRadius: 0.025,
    sleeveMaterial: MATERIAL.sleeve,
    collarMaterial: MATERIAL.collar,
  });
}
for (const x of [-0.48, -0.22, 0.22, 0.48]) {
  model.addCylinder({ center: [x, centerY, 0], length: 0.16, radius: 0.015, axis: "x", material: MATERIAL.grip, segments: 24 });
}

await writeProceduralGlb(model, OUTPUT);
