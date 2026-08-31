import { ExtrudeGeometry, Path, Shape } from "three";
import { ProceduralGlb, writeProceduralGlb } from "./lib/procedural-glb.mjs";
import { addBeamBetween, addPad, addRubberFoot } from "./lib/equipment-parts.mjs";
import { addStationPlate, stationBox, STATION_MATERIAL as M } from "./lib/strength-station-parts.mjs";

const output = process.argv[2] ?? "public/assets/olympic-bench.glb";
const model = new ProceduralGlb({
  generator: "Home Gym Creator Olympic Bench generator v1; integrated flat bench, bar and four plates",
  materials: [
    { name: "Graphite frame", baseColorFactor: [0.035, 0.041, 0.05, 1], metallicFactor: 0.65, roughnessFactor: 0.38 },
    { name: "Burnt orange details", baseColorFactor: [0.65, 0.16, 0.025, 1], metallicFactor: 0.4, roughnessFactor: 0.42 },
    { name: "Black plates feet and liners", baseColorFactor: [0.007, 0.008, 0.01, 1], metallicFactor: 0, roughnessFactor: 0.85 },
    { name: "Zinc bolts", baseColorFactor: [0.48, 0.52, 0.58, 1], metallicFactor: 0.92, roughnessFactor: 0.24 },
    { name: "Steel sleeves and hubs", baseColorFactor: [0.56, 0.6, 0.65, 1], metallicFactor: 0.92, roughnessFactor: 0.25 },
    { name: "Continuous black flat pad", baseColorFactor: [0.021, 0.022, 0.026, 1], metallicFactor: 0, roughnessFactor: 0.83 },
    { name: "Silver bar shaft", baseColorFactor: [0.68, 0.72, 0.77, 1], metallicFactor: 0.95, roughnessFactor: 0.2 },
    { name: "Bar knurling", baseColorFactor: [0.37, 0.4, 0.44, 1], metallicFactor: 0.85, roughnessFactor: 0.5 },
  ],
});
const box = (center, size, material) => stationBox(model, center, size, material);
const tube = (center, length, radius, { material, axis = "x", segments = 20 }) => {
  model.addCylinder({ center, length, radius, material, axis, segments });
};
const beam = (start, end, width = 0.06) => addBeamBetween(model, { start, end, width, depth: width, material: M.graphite });
const bolt = (center, axis) => tube(center, 0.012, 0.011, { material: M.zinc, axis, segments: 6 });

// Authored metres, unit scale; X ±1.10, Z ±0.80, Y 0..1.40. Negative Z is front.
// These are fictional planning dimensions, not an engineering or load certification.
const postZ = 0.55, barZ = 0.45, barY = 1.1;

function fabricatedPlate(points, center, material, { rotation = [0, 0, 0], holes = [] } = {}) {
  const shape = new Shape(points.map(([x, y]) => ({ x, y })));
  for (const [x, y] of holes) {
    const aperture = new Path();
    aperture.absarc(x, y, 0.009, 0, Math.PI * 2, true);
    shape.holes.push(aperture);
  }
  const geometry = new ExtrudeGeometry(shape, { depth: 0.003, curveSegments: 5, bevelEnabled: false });
  model.addGeometry({ center, material, rotation,
    vertices: [...geometry.getAttribute("position").array],
    normals: [...geometry.getAttribute("normal").array],
    indices: Array.from({ length: geometry.getAttribute("position").count }, (_, index) => index),
  });
  geometry.dispose();
}

function addUpright(x) {
  const holes = Array.from({ length: 15 }, (_, row) => [0, 0.61 + row * 0.05]);
  for (const side of [-1, 1]) {
    fabricatedPlate([[-0.04, 0.09], [0.04, 0.09], [0.04, 1.39], [-0.04, 1.39]],
      [x, 0, postZ + (side < 0 ? -0.04 : 0.037)], M.graphite, { holes });
    box([x + side * 0.0385, 0.74, postZ], [0.003, 1.3, 0.074]);
  }
  box([x, 1.395, postZ], [0.085, 0.01, 0.085], M.rubber);
}

function addCup(x, side) {
  // 28 mm shaft rests on a liner whose top is exactly Y=1.086 m.
  box([x, 1.113, 0.503], [0.088, 0.166, 0.014]);
  box([x, 1.07, 0.447], [0.08, 0.022, 0.126]);
  box([x, 1.0835, 0.45], [0.074, 0.005, 0.104], M.rubber);
  box([x, 1.099, 0.387], [0.084, 0.05, 0.014]);
  box([x + side * 0.043, 1.099, 0.389], [0.003, 0.049, 0.017], M.orange);
  box([x, 1.146, 0.493], [0.074, 0.102, 0.006], M.rubber);
  for (const edge of [-1, 1]) box([x + edge * 0.044, 1.113, postZ], [0.008, 0.166, 0.09]);
  bolt([x + side * 0.052, 1.16, postZ], "x");
}

// Two joined rear uprights with longitudinal stabilizers and manufactured gussets.
for (const side of [-1, 1]) {
  const x = side * 0.57;
  box([x, 0.054, 0.545], [0.08, 0.07, 0.44]);
  for (const z of [0.325, 0.755]) {
    addRubberFoot(model, { center: [x, 0.016, z], size: [0.12, 0.032, 0.09], bevel: 0.007, material: M.rubber });
    bolt([x, 0.093, z], "y");
  }
  addUpright(x);
  addCup(x, side);
  beam([x, 0.09, 0.75], [x, 0.38, postZ]);
  fabricatedPlate([[0.34, 0.09], [0.51, 0.09], [0.51, 0.29]],
    [x + side * 0.043, 0, 0], M.orange, { rotation: [0, -Math.PI / 2, 0] });
  bolt([x + side * 0.05, 0.13, 0.48], "x");
  bolt([x, 0.41, 0.505], "z");
}
box([0, 0.13, postZ], [1.14, 0.08, 0.075]);
box([0, 0.13, -0.08], [0.08, 0.08, 1.26]);
box([0, 0.059, -0.73], [0.56, 0.072, 0.10]);
for (const side of [-1, 1]) {
  addRubberFoot(model, { center: [side * 0.25, 0.018, -0.73], size: [0.11, 0.036, 0.14], bevel: 0.008, material: M.rubber });
  bolt([side * 0.09, 0.102, -0.73], "y");
}

// Integrated one-piece flat bench, with no tilt hinge or detached catalog components.
for (const z of [-0.59, 0.43]) {
  box([0, 0.255, z], [0.075, 0.29, 0.075]);
  box([0, 0.397, z], [0.27, 0.016, 0.12]);
  for (const side of [-1, 1]) bolt([side * 0.044, 0.19, z], "x");
}
box([0, 0.36, -0.05], [0.07, 0.06, 1.14]);
addPad(model, { center: [0, 0.418, -0.05], size: [0.33, 0.064, 1.26], bevel: 0.025, material: M.upholstery });
addPad(model, { center: [0, 0.394, -0.05], size: [0.333, 0.004, 1.263], bevel: 0.025, material: M.rubber });

// Loaded Olympic bar: two black bumper plates per end, metal hubs and clamp collars.
tube([0, barY, barZ], 1.38, 0.014, { material: M.chrome });
for (const side of [-1, 1]) {
  for (const x of [0.23, 0.47]) tube([side * x, barY, barZ], 0.15, 0.0142, { material: M.grip });
  tube([side * 0.71, barY, barZ], 0.05, 0.037, { material: M.steel });
  tube([side * 0.9175, barY, barZ], 0.365, 0.025, { material: M.steel });
  for (const x of [0.7675, 0.8365]) {
    addStationPlate(model, { center: [side * x, barY, barZ], thickness: 0.065, radius: 0.225, segments: 32 });
  }
  tube([side * 0.884, barY, barZ], 0.03, 0.038, { material: M.graphite });
  box([side * 0.884, barY + 0.043, barZ], [0.025, 0.025, 0.018], M.orange);
}
tube([0, barY, barZ], 0.12, 0.0142, { material: M.grip });

model.orientFacesToNormals();
await writeProceduralGlb(model, output);
