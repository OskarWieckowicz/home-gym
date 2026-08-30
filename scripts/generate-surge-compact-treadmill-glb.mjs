import { ProceduralGlb, writeProceduralGlb } from "./lib/procedural-glb.mjs";
import { addBeamBetween, addRubberFoot, addWheel } from "./lib/equipment-parts.mjs";

const OUTPUT = process.argv[2] ?? "public/assets/surge-compact-treadmill.glb";
const MATERIAL = { frame: 0, casing: 1, rubber: 2, belt: 3, accent: 4, hardware: 5, display: 6 };
const model = new ProceduralGlb({
  generator: "Home Gym Creator Surge Compact Treadmill generator v1",
  materials: [
    { name: "Graphite treadmill frame", baseColorFactor: [0.025, 0.03, 0.038, 1], metallicFactor: 0.68, roughnessFactor: 0.32 },
    { name: "Moulded charcoal housing", baseColorFactor: [0.075, 0.085, 0.1, 1], metallicFactor: 0.15, roughnessFactor: 0.48 },
    { name: "Rubber steps and grips", baseColorFactor: [0.008, 0.009, 0.011, 1], metallicFactor: 0, roughnessFactor: 0.88 },
    { name: "Running belt", baseColorFactor: [0.024, 0.027, 0.032, 1], metallicFactor: 0, roughnessFactor: 0.95 },
    { name: "Safety orange trim", baseColorFactor: [0.88, 0.19, 0.035, 1], metallicFactor: 0.3, roughnessFactor: 0.36 },
    { name: "Steel fittings", baseColorFactor: [0.49, 0.54, 0.59, 1], metallicFactor: 0.92, roughnessFactor: 0.22 },
    { name: "Teal console screen", baseColorFactor: [0.06, 0.21, 0.24, 1], metallicFactor: 0.12, roughnessFactor: 0.2 },
  ],
});
const box = (center, size, material = MATERIAL.frame) => model.addBox({ center, size, material });

// Metres; 0.78 × 1.62 m footprint, y=0 floor, console/front at negative Z.
model.addChamferedBox({ center: [0, 0.105, 0], size: [0.78, 0.095, 1.62], bevel: 0.035, material: MATERIAL.frame });
box([0, 0.16, 0.14], [0.49, 0.015, 1.24], MATERIAL.belt);
model.addChamferedBox({ center: [0, 0.21, -0.64], size: [0.70, 0.115, 0.34], bevel: 0.04, material: MATERIAL.casing });

for (const side of [-1, 1]) {
  const x = side * 0.325;
  for (const z of [-0.66, 0.67]) {
    addRubberFoot(model, { center: [x, 0.03, z], size: [0.10, 0.06, 0.16], bevel: 0.015, material: MATERIAL.rubber });
  }
  box([side * 0.3175, 0.175, 0.12], [0.105, 0.045, 1.27], MATERIAL.casing);
  box([side * 0.3175, 0.2, 0.12], [0.075, 0.008, 1.20], MATERIAL.rubber);
  box([side * 0.258, 0.185, 0.12], [0.012, 0.015, 1.23], MATERIAL.accent);
  for (let rib = 0; rib < 12; rib += 1) {
    box([side * 0.3175, 0.206, -0.41 + rib * 0.095], [0.07, 0.004, 0.007], MATERIAL.casing);
  }

  // Paired console uprights and folding-pivot covers; the belt stays unobstructed.
  addBeamBetween(model, { start: [x, 0.16, -0.64], end: [x, 1.23, -0.52], width: 0.06, depth: 0.065, material: MATERIAL.frame });
  model.addCylinder({ center: [side * 0.361, 0.235, -0.63], length: 0.03, radius: 0.05, axis: "x", material: MATERIAL.accent, segments: 24 });
  model.addCylinder({ center: [side * 0.38, 0.235, -0.63], length: 0.012, radius: 0.018, axis: "x", material: MATERIAL.hardware, segments: 16 });
  addBeamBetween(model, { start: [x, 1.12, -0.53], end: [x, 1.07, -0.45], width: 0.04, depth: 0.04, material: MATERIAL.frame });
  model.addCylinder({ center: [x, 1.045, -0.29], length: 0.43, radius: 0.025, axis: "z", rotation: [0.14, 0, 0], material: MATERIAL.rubber, segments: 20 });
  addWheel(model, { center: [side * 0.29, 0.065, -0.73], length: 0.035, radius: 0.05, material: MATERIAL.rubber, segments: 20 });
  model.addCylinder({ center: [side * 0.312, 0.065, -0.73], length: 0.012, radius: 0.012, axis: "x", material: MATERIAL.hardware, segments: 12 });
}

// Rear roller cover and adjustment bolts identify the open +Z safety-zone end.
box([0, 0.16, 0.7875], [0.69, 0.05, 0.045], MATERIAL.casing);
for (const x of [-0.30, 0.30]) {
  model.addCylinder({ center: [x, 0.157, 0.802], length: 0.014, radius: 0.012, axis: "z", material: MATERIAL.hardware, segments: 12 });
}
for (let vent = 0; vent < 9; vent += 1) {
  box([-0.20 + vent * 0.05, 0.27, -0.69], [0.012, 0.005, 0.11], MATERIAL.rubber);
}
model.addCylinder({ center: [0, 1.12, -0.52], length: 0.65, radius: 0.024, axis: "x", material: MATERIAL.frame, segments: 20 });

// Console tilts toward the runner (+Z). Its highest housing edge is exactly 1.38 m.
const tilt = 55 * Math.PI / 180;
const consoleY = 1.38 - (0.03 * Math.cos(tilt) + 0.15 * Math.sin(tilt));
function panelPart({ center: [x, y, z], size, bevel, material }) {
  model.addChamferedBox({
    center: [x, consoleY + y * Math.cos(tilt) - z * Math.sin(tilt), -0.52 + y * Math.sin(tilt) + z * Math.cos(tilt)],
    size, bevel, material, rotation: [tilt, 0, 0],
  });
}
panelPart({ center: [0, 0, 0], size: [0.72, 0.06, 0.30], bevel: 0.035, material: MATERIAL.casing });
panelPart({ center: [0, 0.035, -0.025], size: [0.33, 0.01, 0.155], bevel: 0.012, material: MATERIAL.display });
panelPart({ center: [0, 0.043, 0.09], size: [0.045, 0.025, 0.04], bevel: 0.008, material: MATERIAL.accent });
for (const side of [-1, 1]) {
  panelPart({ center: [side * 0.265, 0.033, 0.02], size: [0.095, 0.008, 0.115], bevel: 0.02, material: MATERIAL.rubber });
  panelPart({ center: [side * 0.10, 0.037, 0.09], size: [0.045, 0.014, 0.025], bevel: 0.005, material: MATERIAL.hardware });
}

await writeProceduralGlb(model, OUTPUT);
