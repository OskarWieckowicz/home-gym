import { ExtrudeGeometry, Path, Shape, TorusGeometry } from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ProceduralGlb, writeProceduralGlb } from "./lib/procedural-glb.mjs";

const OUTPUT = process.argv[2] ?? "public/assets/squat-rack.glb";
// Preserve indices: the complete station maps these five materials explicitly.
const FRAME = 0, ORANGE = 1, RUBBER = 2, ZINC = 3, STEEL = 4;
const model = new ProceduralGlb({
  generator: "Home Gym Creator Summit Power Cage generator v3; hollow bolted four-post cage",
  materials: [
    { name: "Graphite powder coat", baseColorFactor: [0.042, 0.049, 0.06, 1], metallicFactor: 0.65, roughnessFactor: 0.4 },
    { name: "Safety orange powder coat", baseColorFactor: [0.88, 0.19, 0.035, 1], metallicFactor: 0.42, roughnessFactor: 0.34 },
    { name: "Black UHMW and rubber", baseColorFactor: [0.006, 0.007, 0.009, 1], metallicFactor: 0.02, roughnessFactor: 0.85 },
    { name: "Zinc hardware", baseColorFactor: [0.52, 0.57, 0.62, 1], metallicFactor: 0.93, roughnessFactor: 0.24 },
    { name: "Brushed steel", baseColorFactor: [0.23, 0.27, 0.3, 1], metallicFactor: 0.9, roughnessFactor: 0.28 },
  ],
});
const postX = 0.535, postZ = 0.48, postSize = 0.075;
const box = (center, size, material = FRAME) => model.addChamferedBox({
  center, size, material, bevel: Math.min(0.002, size[0] / 4, size[2] / 4),
});
const cylinder = (center, length, radius, axis = "x", material = ZINC, segments = 16) => {
  model.addCylinder({ center, length, radius, axis, material, segments });
};

function geometryPart(source, center, material, rotation = [0, 0, 0]) {
  source.deleteAttribute("uv");
  const indexed = mergeVertices(source, 1e-6);
  const { position, normal } = indexed.attributes;
  model.addGeometry({ vertices: [...position.array], normals: [...normal.array],
    indices: [...indexed.index.array], center, material, rotation });
  indexed.dispose();
  source.dispose();
}

function steelPlate(points, center, material = FRAME, rotation = [0, 0, 0], holes = [], depth = 0.004) {
  const outline = new Shape(points.map(([x, y]) => ({ x, y })));
  for (const [height, radius] of holes) {
    const aperture = new Path();
    aperture.absarc(0, height, radius, 0, 2 * Math.PI, true);
    outline.holes.push(aperture);
  }
  geometryPart(new ExtrudeGeometry(outline, { depth, bevelEnabled: false, curveSegments: 4 }),
    center, material, rotation);
}

function bolt(center, axis) {
  cylinder(center, 0.003, 0.012, axis);
  cylinder(center, 0.012, 0.008, axis, ZINC, 6);
}

function ringPin(center, axis) {
  cylinder(center, 0.013, 0.013, axis);
  geometryPart(new TorusGeometry(0.016, 0.002, 6, 16),
    [center[0], center[1] - 0.016, center[2]], ZINC,
    axis === "x" ? [0, Math.PI / 2, 0] : [0, 0, 0]);
}

function upright(x, z) {
  const half = postSize / 2;
  const holes = Array.from({ length: 23 }, (_, row) => [0.38 + row * 0.073, 0.01]);
  const face = [[-half + 0.004, 0.09], [half - 0.004, 0.09], [half - 0.004, 2.25], [-half + 0.004, 2.25]];
  // Four separate 3 mm walls, open on both axes; no solid core or black hole decals.
  for (let side = 0; side < 4; side += 1) {
    const angle = side * Math.PI / 2;
    steelPlate(face, [x + Math.sin(angle) * (half - 0.003), 0, z + Math.cos(angle) * (half - 0.003)],
      FRAME, [0, angle, 0], holes, 0.003);
  }
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) {
    box([x + dx * (half - 0.002), 1.17, z + dz * (half - 0.002)], [0.004, 2.16, 0.004]);
  }
  box([x, 2.256, z], [0.075, 0.012, 0.075], RUBBER);
  box([x, 0.101, z], [0.116, 0.012, 0.116]);
  for (const side of [-1, 1]) {
    // Paired welded gussets spread the column joint onto the longitudinal rail.
    steelPlate([[0, 0], [Math.sign(z) * 0.19, 0], [0, 0.21]],
      [x + side * 0.034 + 0.003, 0.109, z], FRAME, [0, -Math.PI / 2, 0], [], 0.006);
    bolt([x + side * 0.08, 0.075, z], "y");
  }
}

function jCup(x) {
  // Bent 8 mm steel cradle, maintaining the station bar's contact at Y=1.453.
  box([x, 1.48, -0.526], [0.084, 0.19, 0.012], ORANGE);
  for (const side of [-1, 1]) box([x + side * 0.043, 1.48, -0.48], [0.008, 0.19, 0.092], ORANGE);
  steelPlate([[-0.532, 1.575], [-0.532, 1.433], [-0.668, 1.433], [-0.694, 1.455],
    [-0.694, 1.505], [-0.682, 1.505], [-0.682, 1.464], [-0.662, 1.445],
    [-0.544, 1.445], [-0.544, 1.575]], [x + 0.037, 0, 0], ORANGE, [0, -Math.PI / 2, 0], [], 0.074);
  box([x, 1.449, -0.6], [0.066, 0.008, 0.12], RUBBER);
  box([x, 1.518, -0.548], [0.066, 0.106, 0.008], RUBBER);
  box([x, 1.482, -0.678], [0.066, 0.038, 0.008], RUBBER);
  cylinder([x, 1.548, -postZ], 0.109, 0.007);
  ringPin([x + Math.sign(x) * 0.057, 1.548, -postZ], "x");
}

for (const x of [-postX, postX]) {
  box([x, 0.075, 0], [postSize, 0.1, 1.58]);
  for (const z of [-0.66, 0.66]) {
    box([x, 0.035, z], [0.25, 0.046, 0.42]);
    box([x, 0.006, z], [0.25, 0.012, 0.42], RUBBER);
    for (const dx of [-0.08, 0.08]) bolt([x + dx, 0.063, Math.sign(z) * 0.77], "y");
  }
  for (const z of [-postZ, postZ]) upright(x, z);
  // Upper side rails close the cage; slim bolted end plates explain the joints.
  box([x, 2.17, 0], [0.065, 0.09, 0.885]);
  for (const z of [-postZ, postZ]) {
    box([x + Math.sign(x) * 0.043, 2.17, z], [0.008, 0.19, 0.13]);
    for (const y of [2.11, 2.23]) bolt([x + Math.sign(x) * 0.05, y, z], "x");
  }
  jCup(x);
  // Removable pin-and-pipe safeties pass through a matching hole row.
  const safetyY = 0.38 + 10 * 0.073;
  cylinder([x, safetyY, 0], 1.13, 0.009, "z");
  cylinder([x, safetyY, 0], 0.88, 0.026, "z", ORANGE);
  for (const z of [-0.443, 0.443]) cylinder([x, safetyY, z], 0.01, 0.027, "z", RUBBER);
  cylinder([x, safetyY - 0.038, -0.572], 0.09, 0.009, "y");
  ringPin([x, safetyY, 0.574], "z");
  for (const y of [0.53, 0.9]) {
    box([x, y, 0.523], [0.064, 0.12, 0.01]);
    cylinder([x, y, 0.686], 0.316, 0.024, "z", STEEL);
    cylinder([x, y, 0.542], 0.022, 0.037, "z", RUBBER);
    cylinder([x, y, 0.847], 0.006, 0.026, "z", RUBBER);
    for (const dy of [-0.044, 0.044]) bolt([x, y + dy, 0.534], "z");
  }
}

box([0, 0.075, postZ], [1.07, 0.1, postSize]);
// No front floor crossmember to step over when entering the training space.
box([0, 2.17, postZ], [1.07, 0.1, postSize]);
for (const x of [-postX, postX]) {
  box([x, 2.175, -0.525], [0.11, 0.19, 0.014], ORANGE);
  for (const y of [2.11, 2.24]) bolt([x, y, -0.539], "z");
}
cylinder([0, 2.215, -0.56], 1.15, 0.016, "x", STEEL, 24);
for (const x of [-0.535, 0.535]) cylinder([x, 2.215, -0.546], 0.042, 0.024, "z", ORANGE);
for (const x of [-0.35, 0.35]) cylinder([x, 2.215, -0.56], 0.21, 0.018, "x", RUBBER, 24);
box([0, 2.171, 0.437], [0.29, 0.055, 0.008], ORANGE);

model.orientFacesToNormals();
await writeProceduralGlb(model, OUTPUT);
