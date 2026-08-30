import { ProceduralGlb, writeProceduralGlb } from "./lib/procedural-glb.mjs";
import { addBeamBetween, addRubberFoot } from "./lib/equipment-parts.mjs";

const OUTPUT = process.argv[2] ?? "public/assets/range-adjustable-dumbbells.glb";
const MATERIAL = { frame: 0, weights: 1, rubber: 2, selectors: 3, hardware: 4 };
const model = new ProceduralGlb({
  generator: "Home Gym Creator Range Adjustable Dumbbells generator v1",
  materials: [
    { name: "Graphite stand", baseColorFactor: [0.025, 0.032, 0.042, 1], metallicFactor: 0.75, roughnessFactor: 0.3 },
    { name: "Segmented iron weights", baseColorFactor: [0.075, 0.085, 0.10, 1], metallicFactor: 0.65, roughnessFactor: 0.42 },
    { name: "Rubber cradles and feet", baseColorFactor: [0.006, 0.007, 0.009, 1], metallicFactor: 0, roughnessFactor: 0.85 },
    { name: "Orange front selectors", baseColorFactor: [0.95, 0.16, 0.018, 1], metallicFactor: 0.4, roughnessFactor: 0.32 },
    { name: "Steel handles and fasteners", baseColorFactor: [0.52, 0.57, 0.62, 1], metallicFactor: 0.9, roughnessFactor: 0.25 },
  ],
});
const box = (center, size, material = MATERIAL.frame) => model.addBox({ center, size, material });

// Metres; centered 0.48 × 0.54 m footprint, y=0 floor, 0.62 m overall height.
// The open pickup side and orange selector dials face negative Z.
for (const x of [-0.195, 0.195]) {
  box([x, 0.055, 0], [0.045, 0.05, 0.48]);
  for (const z of [-0.21, 0.21]) {
    addRubberFoot(model, { center: [x, 0.015, z], size: [0.09, 0.03, 0.12], bevel: 0.012, material: MATERIAL.rubber });
    model.addCylinder({ center: [x, 0.086, z], radius: 0.01, length: 0.012, axis: "y", material: MATERIAL.hardware, segments: 12 });
  }
}
box([0, 0.06, 0.17], [0.39, 0.05, 0.045]);
box([0, 0.35, 0.14], [0.29, 0.04, 0.04]);

for (const x of [-0.12, 0.12]) {
  box([x, 0.2275, 0.14], [0.045, 0.335, 0.045]);
  box([x, 0.067, 0.17], [0.19, 0.035, 0.075]);
  addBeamBetween(model, { start: [x, 0.09, 0.17], end: [x, 0.38, -0.16], width: 0.032, depth: 0.032, material: MATERIAL.frame });

  // Separate fitted cradles support the weight packs while leaving each grip exposed.
  model.addChamferedBox({ center: [x, 0.4035, 0], size: [0.225, 0.019, 0.50], bevel: 0.018, material: MATERIAL.frame });
  for (const end of [-1, 1]) {
    box([x, 0.412, end * 0.145], [0.19, 0.008, 0.15], MATERIAL.rubber);
    for (const side of [-1, 1]) box([x + side * 0.103, 0.436, end * 0.145], [0.014, 0.055, 0.17], MATERIAL.rubber);

    // Five discrete plates at each end, with gaps that remain readable in the top view.
    for (let plate = 0; plate < 5; plate += 1) {
      model.addCylinder({ center: [x, 0.515, end * (0.09 + plate * 0.027)], length: 0.024, radius: 0.105, axis: "z", material: MATERIAL.weights, segments: 24 });
    }
    model.addCylinder({ center: [x, 0.515, end * 0.214], length: 0.014, radius: 0.073, axis: "z", material: MATERIAL.rubber, segments: 24 });
  }

  // Bare steel grip between the weight packs, with subtle machined rings for scale.
  model.addCylinder({ center: [x, 0.515, 0], length: 0.18, radius: 0.017, axis: "z", material: MATERIAL.hardware, segments: 20 });
  for (const z of [-0.055, -0.033, -0.011, 0.011, 0.033, 0.055]) {
    model.addCylinder({ center: [x, 0.515, z], length: 0.004, radius: 0.018, axis: "z", material: MATERIAL.hardware, segments: 20 });
  }

  model.addCylinder({ center: [x, 0.515, -0.229], length: 0.025, radius: 0.05, axis: "z", material: MATERIAL.selectors, segments: 24 });
  model.addCylinder({ center: [x, 0.515, -0.244], length: 0.007, radius: 0.028, axis: "z", material: MATERIAL.rubber, segments: 20 });
  box([x, 0.548, -0.243], [0.007, 0.013, 0.006], MATERIAL.hardware);
  for (const side of [-1, 1]) {
    model.addCylinder({ center: [x + side * 0.027, 0.35, 0.14], length: 0.014, radius: 0.011, axis: "x", material: MATERIAL.hardware, segments: 12 });
  }
}

await writeProceduralGlb(model, OUTPUT);
