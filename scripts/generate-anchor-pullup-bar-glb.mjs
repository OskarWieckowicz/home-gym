import { addBeamBetween } from "./lib/equipment-parts.mjs";
import { ProceduralGlb, writeProceduralGlb } from "./lib/procedural-glb.mjs";

const OUTPUT = process.argv[2] ?? "public/assets/anchor-pullup-bar.glb";
const MATERIAL = { frame: 0, accent: 1, grip: 2, hardware: 3 };
const model = new ProceduralGlb({
  generator: "Home Gym Creator Anchor Pull-Up Bar generator v1",
  materials: [
    { name: "Graphite powder coat", baseColorFactor: [0.025, 0.03, 0.038, 1], metallicFactor: 0.7, roughnessFactor: 0.32 },
    { name: "Forgewell orange brackets", baseColorFactor: [0.9, 0.2, 0.035, 1], metallicFactor: 0.42, roughnessFactor: 0.34 },
    { name: "Textured black grips", baseColorFactor: [0.006, 0.007, 0.009, 1], metallicFactor: 0.02, roughnessFactor: 0.88 },
    { name: "Zinc mounting hardware", baseColorFactor: [0.5, 0.55, 0.6, 1], metallicFactor: 0.94, roughnessFactor: 0.2 },
  ],
});

// Canonical envelope: 1.12 m wide x 0.54 m deep x 0.38 m high. Front is negative Z.
for (const x of [-0.46, 0.46]) {
  model.addBox({ center: [x, 0.19, 0.235], size: [0.1, 0.38, 0.04], material: MATERIAL.accent });
  for (const y of [0.075, 0.305]) {
    model.addCylinder({ center: [x, y, 0.257], length: 0.012, radius: 0.016, axis: "z", material: MATERIAL.hardware, segments: 16 });
  }
  addBeamBetween(model, {
    start: [x, 0.09, 0.215], end: [x, 0.305, -0.23], width: 0.045, depth: 0.055, material: MATERIAL.frame,
  });
  model.addCylinder({ center: [x, 0.325, -0.18], length: 0.18, radius: 0.022, axis: "z", material: MATERIAL.frame, segments: 20 });
}

model.addCylinder({ center: [0, 0.325, -0.247], length: 1.12, radius: 0.03, axis: "x", material: MATERIAL.frame, segments: 24 });
for (const x of [-0.39, -0.14, 0.14, 0.39]) {
  model.addCylinder({ center: [x, 0.325, -0.247], length: 0.15, radius: 0.03, axis: "x", material: MATERIAL.grip, segments: 24 });
}
for (const x of [-0.24, 0.24]) {
  model.addCylinder({ center: [x, 0.285, -0.18], length: 0.18, radius: 0.026, axis: "z", material: MATERIAL.grip, segments: 20 });
}

await writeProceduralGlb(model, OUTPUT);
