import { ProceduralGlb } from "./lib/procedural-glb.mjs";

const OUTPUT = process.argv[2] ?? "public/assets/squat-rack.glb";
const materials = [
  { name: "Graphite powder coat", baseColorFactor: [0.025, 0.032, 0.042, 1], metallicFactor: 0.78, roughnessFactor: 0.25 },
  { name: "Safety orange powder coat", baseColorFactor: [0.95, 0.16, 0.018, 1], metallicFactor: 0.48, roughnessFactor: 0.28 },
  { name: "Black UHMW and rubber", baseColorFactor: [0.006, 0.007, 0.009, 1], metallicFactor: 0.02, roughnessFactor: 0.78 },
  { name: "Zinc hardware", baseColorFactor: [0.52, 0.57, 0.62, 1], metallicFactor: 0.93, roughnessFactor: 0.2 },
  { name: "Brushed steel", baseColorFactor: [0.23, 0.27, 0.3, 1], metallicFactor: 0.9, roughnessFactor: 0.24 },
];

const model = new ProceduralGlb({ generator: "Home Gym Creator Summit Power Cage generator v2", materials });
const box = (center, size, material = 0) => model.addBox({ center, size, material });
const cylinder = (center, length, radius, axis = "x", material = 0, segments = 20) => {
  model.addCylinder({ center, length, radius, axis, material, segments });
};

// This accepted revision preserves the benchmark geometry. Optimization only
// merges the 251 authored parts into one static mesh per material.
const postX = 0.535, postZ = 0.48, postSize = 0.075;
for (const x of [-postX, postX]) for (const z of [-postZ, postZ]) {
  box([x, 1.125, z], [postSize, 2.25, postSize]);
  box([x, 2.256, z], [0.067, 0.012, 0.067], 2);
}
for (const z of [-postZ, postZ]) {
  box([0, 0.075, z], [1.15, 0.1, postSize]);
  box([0, 2.17, z], [1.15, 0.1, postSize]);
}
for (const x of [-postX, postX]) {
  box([x, 0.075, 0], [postSize, 0.1, 1.18]);
  box([x, 0.035, -0.66], [0.25, 0.07, 0.42]);
  box([x, 0.035, 0.66], [0.25, 0.07, 0.42]);
  box([x, 0.012, -0.79], [0.23, 0.024, 0.14], 2);
  box([x, 0.012, 0.79], [0.23, 0.024, 0.14], 2);
}

cylinder([0, 2.215, -0.49], 1.18, 0.032, "x", 4, 28);
for (const x of [-postX, postX]) {
  box([x, 2.175, -0.49], [0.12, 0.19, 0.11], 1);
  cylinder([x, 2.17, -0.535], 0.105, 0.015, "z", 3, 16);
}

for (const x of [-postX, postX]) for (const z of [-postZ, postZ]) {
  for (let row = 0; row < 23; row += 1) {
    const y = 0.38 + row * 0.073;
    cylinder([x + Math.sign(x) * 0.039, y, z], 0.006, 0.009, "x", 2, 12);
    cylinder([x, y, z + Math.sign(z) * 0.039], 0.006, 0.009, "z", 2, 12);
  }
}

for (const x of [-postX, postX]) {
  box([x, 1.47, -0.525], [0.13, 0.22, 0.12], 1);
  box([x, 1.405, -0.585], [0.14, 0.075, 0.24], 1);
  box([x, 1.448, -0.59], [0.125, 0.012, 0.2], 2);
  box([x, 1.48, -0.69], [0.14, 0.14, 0.045], 1);
  cylinder([x, 1.08, 0], 1.13, 0.022, "z", 3, 20);
  cylinder([x, 1.08, 0], 0.88, 0.031, "z", 1, 20);
  cylinder([x, 1.08, -0.61], 0.22, 0.042, "z", 1, 20);
}

for (const y of [0.53, 0.9]) for (const x of [-postX, postX]) {
  cylinder([x, y, postZ + 0.19], 0.38, 0.024, "z", 4, 20);
  cylinder([x, y, postZ + 0.04], 0.035, 0.045, "z", 3, 20);
}
for (const x of [-postX, postX]) for (const z of [-postZ, postZ]) {
  for (const y of [0.1, 2.17]) cylinder([x + Math.sign(x) * 0.041, y, z], 0.018, 0.016, "x", 3, 16);
}
for (const x of [-postX - 0.08, -postX + 0.08, postX - 0.08, postX + 0.08]) for (const z of [-0.77, 0.77]) {
  cylinder([x, 0.071, z], 0.012, 0.014, "y", 2, 14);
}
box([0, 2.171, -0.522], [0.34, 0.07, 0.012], 1);
box([0, 2.171, -0.53], [0.2, 0.016, 0.006], 3);

const metrics = await model.write(OUTPUT);
const dimensions = metrics.max.map((value, axis) => value - metrics.min[axis]);
console.log(`Generated ${OUTPUT}`);
console.log(JSON.stringify({ ...metrics, dimensions }, null, 2));
