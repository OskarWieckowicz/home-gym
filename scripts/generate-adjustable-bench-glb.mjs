import { ProceduralGlb } from "./lib/procedural-glb.mjs";
import { addBeamBetween, addPad, addRubberFoot, addWheel } from "./lib/equipment-parts.mjs";

const OUTPUT = process.argv[2] ?? "public/assets/arc-adjustable-bench.glb";
const DEG = Math.PI / 180;
const INCLINE = 35 * DEG;

const MATERIAL = { frame: 0, upholstery: 1, rubber: 2, accent: 3, hardware: 4 };
const materials = [
  { name: "Graphite powder coat", baseColorFactor: [0.022, 0.027, 0.034, 1], metallicFactor: 0.72, roughnessFactor: 0.3 },
  { name: "Charcoal upholstery", baseColorFactor: [0.018, 0.019, 0.022, 1], metallicFactor: 0.01, roughnessFactor: 0.82 },
  { name: "Black rubber", baseColorFactor: [0.004, 0.005, 0.007, 1], metallicFactor: 0, roughnessFactor: 0.9 },
  { name: "Burnt orange powder coat", baseColorFactor: [0.86, 0.19, 0.035, 1], metallicFactor: 0.42, roughnessFactor: 0.32 },
  { name: "Brushed zinc hardware", baseColorFactor: [0.52, 0.57, 0.62, 1], metallicFactor: 0.9, roughnessFactor: 0.23 },
];

const model = new ProceduralGlb({ generator: "Home Gym Creator Arc Adjustable Bench generator v1", materials });

// Canonical floor footprint: 0.66 m wide x 1.42 m deep. Front is negative Z.
model.addBox({ center: [0, 0.095, 0.015], size: [0.085, 0.075, 1.22], material: MATERIAL.frame });
model.addBox({ center: [0, 0.052, -0.57], size: [0.66, 0.075, 0.11], material: MATERIAL.frame });
model.addBox({ center: [0, 0.052, 0.57], size: [0.56, 0.075, 0.11], material: MATERIAL.frame });

for (const x of [-0.278, 0.278]) {
  addRubberFoot(model, { center: [x, 0.014, -0.57], size: [0.09, 0.028, 0.14], bevel: 0.018, material: MATERIAL.rubber });
}
for (const x of [-0.228, 0.228]) {
  addRubberFoot(model, { center: [x, 0.014, 0.57], size: [0.09, 0.028, 0.14], bevel: 0.018, material: MATERIAL.rubber });
}

// Seat support tower and bracing.
for (const x of [-0.15, 0.15]) {
  addBeamBetween(model, { start: [x, 0.11, -0.48], end: [x, 0.395, -0.34], width: 0.05, depth: 0.05, material: MATERIAL.frame });
  addBeamBetween(model, { start: [x, 0.11, -0.49], end: [x, 0.37, -0.1], width: 0.045, depth: 0.045, material: MATERIAL.frame });
}
model.addBox({ center: [0, 0.385, -0.29], size: [0.39, 0.055, 0.34], material: MATERIAL.frame });

// Separate seat and back pads, including visible steel backing plates.
addPad(model, { center: [0, 0.442, -0.29], size: [0.39, 0.07, 0.42], bevel: 0.035, material: MATERIAL.upholstery });
model.addChamferedBox({ center: [0, 0.401, -0.29], size: [0.35, 0.018, 0.38], bevel: 0.025, material: MATERIAL.frame });

const hinge = [0, 0.43, -0.045];
const backLength = 0.84;
const backCenter = [0, hinge[1] + Math.sin(INCLINE) * backLength / 2, hinge[2] + Math.cos(INCLINE) * backLength / 2];
addPad(model, { center: backCenter, size: [0.34, 0.075, backLength], bevel: 0.032, material: MATERIAL.upholstery, rotation: [-INCLINE, 0, 0] });
model.addChamferedBox({ center: [0, backCenter[1] - Math.cos(INCLINE) * 0.048, backCenter[2] + Math.sin(INCLINE) * 0.048], size: [0.3, 0.018, backLength - 0.06], bevel: 0.024, material: MATERIAL.frame, rotation: [-INCLINE, 0, 0] });

// Seven-position ladder and the engaged backrest support strut.
for (const x of [-0.105, 0.105]) addBeamBetween(model, { start: [x, 0.16, 0.02], end: [x, 0.15, 0.49], width: 0.026, depth: 0.032, material: MATERIAL.frame });
for (let position = 0; position < 7; position += 1) {
  const z = 0.075 + position * 0.064;
  model.addBox({ center: [0, 0.184, z], size: [0.255, 0.04, 0.027], material: MATERIAL.frame, rotation: [-10 * DEG, 0, 0] });
}
addBeamBetween(model, { start: [0, 0.38, 0.09], end: [0, 0.205, 0.345], width: 0.055, depth: 0.05, material: MATERIAL.frame });
model.addCylinder({ center: [0, 0.205, 0.345], length: 0.28, radius: 0.018, axis: "x", material: MATERIAL.hardware, segments: 18 });

// Orange pivot plates and restrained visible hardware.
for (const x of [-0.195, 0.195]) {
  model.addChamferedBox({ center: [x, 0.405, -0.045], size: [0.018, 0.13, 0.13], bevel: 0.022, material: MATERIAL.accent });
  model.addCylinder({ center: [x + Math.sign(x) * 0.012, 0.43, -0.045], length: 0.024, radius: 0.024, axis: "x", material: MATERIAL.hardware, segments: 18 });
  model.addCylinder({ center: [x + Math.sign(x) * 0.012, 0.37, -0.015], length: 0.024, radius: 0.014, axis: "x", material: MATERIAL.hardware, segments: 16 });
}

// Lift handle at the front and transport wheels at the rear.
model.addCylinder({ center: [0, 0.16, -0.67], length: 0.36, radius: 0.018, axis: "x", material: MATERIAL.frame, segments: 18 });
for (const x of [-0.145, 0.145]) {
  model.addCylinder({ center: [x, 0.16, -0.67], length: 0.095, radius: 0.027, axis: "x", material: MATERIAL.rubber, segments: 20 });
  addWheel(model, { center: [x, 0.075, 0.655], length: 0.045, radius: 0.058, material: MATERIAL.rubber, segments: 22 });
  model.addCylinder({ center: [x + Math.sign(x) * 0.025, 0.075, 0.655], length: 0.012, radius: 0.018, axis: "x", material: MATERIAL.hardware, segments: 16 });
  model.addBox({ center: [x, 0.105, 0.6], size: [0.055, 0.12, 0.08], material: MATERIAL.accent, rotation: [-12 * DEG, 0, 0] });
}

// Foot-joint bolts provide scale cues without introducing extra draw calls.
for (const [x, z] of [[-0.22, -0.57], [0.22, -0.57], [-0.18, 0.57], [0.18, 0.57]]) {
  model.addCylinder({ center: [x, 0.054, z - 0.056], length: 0.014, radius: 0.012, axis: "z", material: MATERIAL.hardware, segments: 14 });
}

const metrics = await model.write(OUTPUT);
const dimensions = metrics.max.map((value, axis) => value - metrics.min[axis]);
console.log(`Generated ${OUTPUT}`);
console.log(JSON.stringify({ ...metrics, dimensions }, null, 2));
