import { addBeamBetween, addPad, addRubberFoot, addWheel } from "./lib/equipment-parts.mjs";
import { ProceduralGlb, writeProceduralGlb } from "./lib/procedural-glb.mjs";

const OUTPUT = process.argv[2] ?? "public/assets/current-fold-bike.glb";
const DEG = Math.PI / 180;
const MATERIAL = { frame: 0, accent: 1, casing: 2, rubber: 3, upholstery: 4, hardware: 5, display: 6 };

const model = new ProceduralGlb({
  generator: "Home Gym Creator Current Fold Bike generator v1",
  materials: [
    { name: "Graphite powder coat", baseColorFactor: [0.025, 0.03, 0.038, 1], metallicFactor: 0.68, roughnessFactor: 0.32 },
    { name: "Burnt orange folding frame", baseColorFactor: [0.88, 0.19, 0.035, 1], metallicFactor: 0.42, roughnessFactor: 0.34 },
    { name: "Flywheel housing", baseColorFactor: [0.075, 0.085, 0.1, 1], metallicFactor: 0.3, roughnessFactor: 0.48 },
    { name: "Black rubber", baseColorFactor: [0.006, 0.007, 0.009, 1], metallicFactor: 0, roughnessFactor: 0.9 },
    { name: "Saddle upholstery", baseColorFactor: [0.025, 0.026, 0.03, 1], metallicFactor: 0.01, roughnessFactor: 0.78 },
    { name: "Brushed hardware", baseColorFactor: [0.49, 0.54, 0.59, 1], metallicFactor: 0.92, roughnessFactor: 0.22 },
    { name: "Console display", baseColorFactor: [0.06, 0.16, 0.18, 1], metallicFactor: 0.12, roughnessFactor: 0.2 },
  ],
});

// Canonical envelope: 0.53 m wide x 0.98 m deep x 1.18 m high. Front is negative Z.
// Wide floor bars establish stable, exact bounds while the paired diagonals retain the folding X silhouette.
for (const z of [-0.43, 0.43]) {
  model.addBox({ center: [0, 0.045, z], size: [0.53, 0.09, 0.12], material: MATERIAL.frame });
  for (const x of [-0.225, 0.225]) {
    addRubberFoot(model, { center: [x, 0.013, z], size: [0.08, 0.026, 0.12], bevel: 0.012, material: MATERIAL.rubber });
  }
}

addBeamBetween(model, {
  start: [0, 0.1, -0.34], end: [0, 0.86, 0.19], width: 0.068, depth: 0.068, material: MATERIAL.accent,
});
addBeamBetween(model, {
  start: [0, 0.1, 0.34], end: [0, 0.85, -0.2], width: 0.062, depth: 0.062, material: MATERIAL.frame,
});
model.addCylinder({ center: [0, 0.47, -0.005], length: 0.13, radius: 0.052, axis: "x", material: MATERIAL.hardware, segments: 20 });

// Side-on flywheel enclosure and drive pod remain readable at room scale.
model.addCylinder({ center: [0, 0.36, -0.055], length: 0.17, radius: 0.18, axis: "x", material: MATERIAL.casing, segments: 32 });
model.addCylinder({ center: [-0.087, 0.36, -0.055], length: 0.012, radius: 0.095, axis: "x", material: MATERIAL.accent, segments: 28 });
model.addCylinder({ center: [0, 0.36, -0.055], length: 0.205, radius: 0.026, axis: "x", material: MATERIAL.hardware, segments: 18 });

// Opposed crank arms and textured pedals communicate function without animation.
for (const side of [-1, 1]) {
  model.addBox({
    center: [side * 0.125, 0.36, -0.055 + side * 0.065],
    size: [0.026, 0.025, 0.15],
    rotation: [side * 24 * DEG, 0, 0],
    material: MATERIAL.hardware,
  });
  model.addChamferedBox({
    center: [side * 0.205, 0.36 + side * 0.06, -0.055 + side * 0.12],
    size: [0.105, 0.035, 0.085], bevel: 0.012, material: MATERIAL.rubber,
  });
}

// Telescoping saddle mast, adjustment pin, and broad compact-bike saddle.
addBeamBetween(model, {
  start: [0, 0.56, 0.06], end: [0, 0.96, 0.23], width: 0.052, depth: 0.052, material: MATERIAL.frame,
});
model.addCylinder({ center: [0, 0.73, 0.135], length: 0.09, radius: 0.018, axis: "x", material: MATERIAL.hardware, segments: 16 });
addPad(model, {
  center: [0, 0.98, 0.24], size: [0.29, 0.075, 0.22], bevel: 0.045, material: MATERIAL.upholstery,
});

// Front mast terminates in a full-width handlebar, small console, and downward-facing grips.
addBeamBetween(model, {
  start: [0, 0.67, -0.16], end: [0, 1.03, -0.28], width: 0.055, depth: 0.055, material: MATERIAL.accent,
});
model.addCylinder({ center: [0, 1.105, -0.31], length: 0.45, radius: 0.021, axis: "x", material: MATERIAL.frame, segments: 20 });
for (const x of [-0.17, 0.17]) {
  model.addCylinder({ center: [x, 1.085, -0.34], length: 0.105, radius: 0.027, axis: "z", material: MATERIAL.rubber, segments: 18, rotation: [20 * DEG, 0, 0] });
}
model.addChamferedBox({ center: [0, 1.13, -0.295], size: [0.17, 0.08, 0.075], bevel: 0.014, material: MATERIAL.casing, rotation: [-12 * DEG, 0, 0] });
model.addChamferedBox({ center: [0, 1.171, -0.32], size: [0.115, 0.018, 0.052], bevel: 0.009, material: MATERIAL.display });

// Rear transport wheels contact the floor and sit inside the canonical stabilizer footprint.
for (const x of [-0.17, 0.17]) {
  addWheel(model, { center: [x, 0.045, 0.445], length: 0.04, radius: 0.045, material: MATERIAL.rubber, segments: 20 });
  model.addCylinder({ center: [x + Math.sign(x) * 0.022, 0.045, 0.445], length: 0.012, radius: 0.014, axis: "x", material: MATERIAL.hardware, segments: 14 });
}

await writeProceduralGlb(model, OUTPUT);
