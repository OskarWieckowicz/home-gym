import { ProceduralGlb, writeProceduralGlb } from "./lib/procedural-glb.mjs";

const OUTPUT = process.argv[2] ?? "public/assets/northstar-half-rack.glb";
const MATERIAL = { frame: 0, accent: 1, rubber: 2, hardware: 3 };
const model = new ProceduralGlb({
  generator: "Home Gym Creator Northstar Half Rack generator v1",
  materials: [
    { name: "Graphite powder coat", baseColorFactor: [0.025, 0.032, 0.042, 1], metallicFactor: 0.78, roughnessFactor: 0.25 },
    { name: "Safety orange powder coat", baseColorFactor: [0.95, 0.16, 0.018, 1], metallicFactor: 0.48, roughnessFactor: 0.28 },
    { name: "Black UHMW and rubber", baseColorFactor: [0.006, 0.007, 0.009, 1], metallicFactor: 0.02, roughnessFactor: 0.78 },
    { name: "Zinc hardware", baseColorFactor: [0.52, 0.57, 0.62, 1], metallicFactor: 0.93, roughnessFactor: 0.2 },
  ],
});
const box = (center, size, material = MATERIAL.frame) => model.addBox({ center, size, material });
const pin = (center, length, radius, axis, material = MATERIAL.hardware, segments = 12) => {
  model.addCylinder({ center, length, radius, axis, material, segments });
};
function brace(x, fromY, fromZ, toY, toZ, width, depth, material = MATERIAL.frame) {
  model.addBox({
    center: [x, (fromY + toY) / 2, (fromZ + toZ) / 2],
    size: [width, Math.hypot(toY - fromY, toZ - fromZ), depth],
    rotation: [Math.atan2(toZ - fromZ, toY - fromY), 0, 0],
    material,
  });
}

// Metres; exact 1.22 × 1.30 m floor envelope, 2.15 m high, front at negative Z.
// Only two tall uprights: the open front and cantilever arms distinguish this from the cage.
const postX = 0.515, postZ = 0.22;
for (const side of [-1, 1]) {
  const x = side * postX;
  box([x, 0.065, 0], [0.08, 0.09, 1.30]);
  for (const z of [-0.56, 0.56]) {
    model.addChamferedBox({ center: [x, 0.015, z], size: [0.19, 0.03, 0.18], bevel: 0.012, material: MATERIAL.rubber });
    box([x, 0.037, z], [0.18, 0.014, 0.17]);
    for (const offset of [-0.065, 0.065]) pin([x + offset, 0.05, z], 0.012, 0.011, "y");
  }
  box([x, 1.1225, postZ], [0.075, 2.035, 0.075]);
  box([x, 2.145, postZ], [0.075, 0.01, 0.075], MATERIAL.rubber);
  brace(x, 0.11, 0.56, 0.8, postZ, 0.055, 0.055);
  box([x, 0.16, postZ], [0.105, 0.16, 0.12]);

  // Adjustment-hole impressions are deliberately shallow, like the accepted Summit asset.
  for (let row = 0; row < 23; row += 1) {
    const y = 0.35 + row * 0.075;
    pin([x, y, postZ - 0.039], 0.004, 0.009, "z", MATERIAL.rubber);
    pin([x + side * 0.039, y, postZ], 0.004, 0.009, "x", MATERIAL.rubber);
  }

  // Removable J-cups: back plate, padded shelf, and raised retaining lip.
  box([x, 1.46, 0.17], [0.115, 0.2, 0.035], MATERIAL.accent);
  box([x, 1.39, 0.09], [0.115, 0.045, 0.19], MATERIAL.accent);
  box([x, 1.4185, 0.08], [0.1, 0.012, 0.14], MATERIAL.rubber);
  box([x, 1.435, -0.012], [0.115, 0.115, 0.025], MATERIAL.accent);
  pin([x + side * 0.055, 1.46, postZ], 0.04, 0.015, "x");

  // Cantilever safety arms project toward negative Z; the floor rail extends past their tips.
  box([x, 0.89, 0.17], [0.115, 0.27, 0.045], MATERIAL.accent);
  box([x, 0.85, -0.185], [0.09, 0.075, 0.71], MATERIAL.accent);
  box([x, 0.894, -0.185], [0.08, 0.013, 0.67], MATERIAL.rubber);
  box([x, 0.895, -0.53], [0.09, 0.14, 0.03], MATERIAL.accent);
  brace(x, 0.77, 0.14, 0.82, -0.08, 0.055, 0.045, MATERIAL.accent);
  pin([x + side * 0.06, 0.87, postZ], 0.05, 0.015, "x");

  // Upper gussets and bolted bar mounts.
  box([x, 2.045, 0.16], [0.115, 0.16, 0.14], MATERIAL.accent);
  pin([x, 2.055, 0.083], 0.016, 0.013, "z");
  for (const y of [0.16, 0.74, 2.045]) pin([x + side * 0.047, y, postZ], 0.024, 0.014, "x");
}

// Rear crossmembers tie the base and uprights together without closing the training area.
box([0, 0.12, 0.54], [1.105, 0.08, 0.075]);
box([0, 2.045, postZ], [1.105, 0.09, 0.075]);
pin([0, 2.08, 0.095], 1.105, 0.017, "x", MATERIAL.hardware, 24);
for (const side of [-1, 1]) pin([side * 0.35, 2.08, 0.095], 0.24, 0.019, "x", MATERIAL.rubber, 24);
box([0, 2.045, 0.177], [0.25, 0.055, 0.012], MATERIAL.accent);
box([0, 2.045, 0.169], [0.12, 0.012, 0.005], MATERIAL.hardware);

await writeProceduralGlb(model, OUTPUT);
