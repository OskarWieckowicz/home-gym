import { ProceduralGlb, writeProceduralGlb } from "./lib/procedural-glb.mjs";
import { addBeamBetween, addPad, addRubberFoot, addWheel } from "./lib/equipment-parts.mjs";

const OUTPUT = process.argv[2] ?? "public/assets/pivot-flat-bench.glb";
const MATERIAL = { frame: 0, upholstery: 1, rubber: 2, accent: 3, hardware: 4 };
const model = new ProceduralGlb({
  generator: "Home Gym Creator Pivot Flat Bench generator v1",
  materials: [
    { name: "Graphite frame", baseColorFactor: [0.022, 0.027, 0.034, 1], metallicFactor: 0.72, roughnessFactor: 0.3 },
    { name: "Charcoal flat pad", baseColorFactor: [0.018, 0.019, 0.022, 1], metallicFactor: 0.01, roughnessFactor: 0.82 },
    { name: "Rubber feet and grips", baseColorFactor: [0.004, 0.005, 0.007, 1], metallicFactor: 0, roughnessFactor: 0.9 },
    { name: "Burnt orange brackets", baseColorFactor: [0.86, 0.19, 0.035, 1], metallicFactor: 0.42, roughnessFactor: 0.32 },
    { name: "Zinc fasteners", baseColorFactor: [0.52, 0.57, 0.62, 1], metallicFactor: 0.9, roughnessFactor: 0.23 },
  ],
});
const box = (center, size, material = MATERIAL.frame) => model.addBox({ center, size, material });

// Metres. Exact 0.58 × 1.24 m footprint; floor y=0; front/lift handle faces -Z.
// One continuous horizontal pad distinguishes Pivot from the adjustable Arc bench.
addPad(model, { center: [0, 0.405, 0], size: [0.31, 0.07, 1.10], bevel: 0.028, material: MATERIAL.upholstery });
model.addChamferedBox({ center: [0, 0.36, 0], size: [0.285, 0.02, 1.06], bevel: 0.02, material: MATERIAL.frame });
box([0, 0.315, 0], [0.075, 0.07, 1.02]);

// Narrow front stabilizer allows foot placement; the wider rear stabilizer resists rocking.
for (const { z, width } of [{ z: -0.46, width: 0.38 }, { z: 0.55, width: 0.58 }]) {
  box([0, 0.06, z], [width - 0.035, 0.075, 0.08]);
  for (const side of [-1, 1]) {
    const x = side * (width / 2 - 0.045);
    addRubberFoot(model, { center: [x, 0.018, z], size: [0.09, 0.036, 0.14], bevel: 0.012, material: MATERIAL.rubber });
    model.addCylinder({ center: [x, 0.103, z], length: 0.014, radius: 0.011, axis: "y", material: MATERIAL.hardware, segments: 12 });
  }
}

// Fixed supports and triangulation; no adjustment mechanism or segmented upholstery.
for (const [baseZ, topZ] of [[-0.46, -0.35], [0.55, 0.39]]) {
  addBeamBetween(model, { start: [0, 0.097, baseZ], end: [0, 0.31, topZ], width: 0.065, depth: 0.065, material: MATERIAL.frame });
  addBeamBetween(model, { start: [0, 0.11, baseZ], end: [0, 0.285, topZ * 0.35], width: 0.04, depth: 0.04, material: MATERIAL.frame });
  box([0, 0.342, topZ], [0.27, 0.016, 0.095]);
  for (const side of [-1, 1]) {
    box([side * 0.041, 0.29, topZ], [0.014, 0.095, 0.12], MATERIAL.accent);
    model.addCylinder({ center: [side * 0.055, 0.29, topZ], length: 0.016, radius: 0.013, axis: "x", material: MATERIAL.hardware, segments: 12 });
  }
}

// Attached U-shaped front handle; the grip defines the -0.62 m front extent.
for (const x of [-0.105, 0.105]) {
  addBeamBetween(model, { start: [x, 0.34, -0.35], end: [x, 0.21, -0.60], width: 0.022, depth: 0.022, material: MATERIAL.frame });
}
model.addCylinder({ center: [0, 0.21, -0.60], length: 0.25, radius: 0.014, axis: "x", material: MATERIAL.frame, segments: 20 });
model.addCylinder({ center: [0, 0.21, -0.60], length: 0.18, radius: 0.02, axis: "x", material: MATERIAL.rubber, segments: 20 });

// Rear wheels sit above the floor until the front is lifted.
for (const side of [-1, 1]) {
  const x = side * 0.20;
  box([x, 0.09, 0.55], [0.022, 0.07, 0.10], MATERIAL.accent);
  addWheel(model, { center: [x + side * 0.031, 0.065, 0.565], length: 0.04, radius: 0.047, material: MATERIAL.rubber, segments: 20 });
  model.addCylinder({ center: [x + side * 0.035, 0.065, 0.565], length: 0.065, radius: 0.012, axis: "x", material: MATERIAL.hardware, segments: 12 });
}

await writeProceduralGlb(model, OUTPUT);
