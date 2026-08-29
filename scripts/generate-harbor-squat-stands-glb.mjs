import { ProceduralGlb, writeProceduralGlb } from "./lib/procedural-glb.mjs";

const OUTPUT = process.argv[2] ?? "public/assets/harbor-squat-stands.glb";
const MATERIAL = { frame: 0, accent: 1, hardware: 2, rubber: 3 };
const model = new ProceduralGlb({
  generator: "Home Gym Creator Harbor Squat Stands generator v1",
  materials: [
    { name: "Graphite powder coat", baseColorFactor: [0.025, 0.03, 0.038, 1], metallicFactor: 0.72, roughnessFactor: 0.3 },
    { name: "Kiln orange powder coat", baseColorFactor: [0.88, 0.19, 0.035, 1], metallicFactor: 0.42, roughnessFactor: 0.34 },
    { name: "Zinc hardware", baseColorFactor: [0.5, 0.55, 0.6, 1], metallicFactor: 0.93, roughnessFactor: 0.2 },
    { name: "Black rubber", baseColorFactor: [0.006, 0.007, 0.009, 1], metallicFactor: 0, roughnessFactor: 0.9 },
  ],
});

// Canonical envelope: 1.08 m wide x 0.82 m deep x 1.78 m high. Front is negative Z.
for (const side of [-1, 1]) {
  const x = side * 0.38;
  model.addBox({ center: [x, 0.045, 0], size: [0.32, 0.09, 0.82], material: MATERIAL.frame });
  for (const z of [-0.36, 0.36]) {
    model.addChamferedBox({ center: [x, 0.015, z], size: [0.32, 0.03, 0.1], bevel: 0.012, material: MATERIAL.rubber });
  }

  model.addBox({ center: [x, 0.79, 0.16], size: [0.075, 1.49, 0.075], material: MATERIAL.frame });
  model.addBox({ center: [x, 1.55, 0.16], size: [0.055, 0.4, 0.055], material: MATERIAL.hardware });
  model.addChamferedBox({ center: [x, 1.755, 0.16], size: [0.068, 0.05, 0.068], bevel: 0.008, material: MATERIAL.rubber });

  // J-cup and forward spotter arm make each independent stand readable at room scale.
  model.addBox({ center: [x, 1.48, 0.105], size: [0.13, 0.17, 0.09], material: MATERIAL.accent });
  model.addBox({ center: [x, 1.415, -0.005], size: [0.13, 0.055, 0.26], material: MATERIAL.accent });
  model.addBox({ center: [x, 1.447, -0.105], size: [0.115, 0.012, 0.18], material: MATERIAL.rubber });
  model.addBox({ center: [x, 1.49, -0.21], size: [0.13, 0.16, 0.05], material: MATERIAL.accent });

  for (let row = 0; row < 12; row += 1) {
    model.addCylinder({
      center: [x + side * 0.039, 0.55 + row * 0.075, 0.16],
      length: 0.008,
      radius: 0.009,
      axis: "x",
      material: MATERIAL.rubber,
      segments: 12,
    });
  }
  model.addCylinder({ center: [x + side * 0.077, 1.49, 0.16], length: 0.08, radius: 0.014, axis: "x", material: MATERIAL.hardware, segments: 16 });
}

await writeProceduralGlb(model, OUTPUT);
