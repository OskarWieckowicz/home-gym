import { ExtrudeGeometry, Path, Shape, TorusGeometry } from "three";
import { ProceduralGlb, writeProceduralGlb } from "./lib/procedural-glb.mjs";

const OUTPUT = process.argv[2] ?? "public/assets/harbor-squat-stands.glb";
const FRAME = 0, ORANGE = 1, STEEL = 2, RUBBER = 3;
const model = new ProceduralGlb({
  generator: "Home Gym Creator Harbor Squat Stands generator v2; catalog-guided static pair",
  materials: [
    { name: "Graphite powder coat", baseColorFactor: [0.042, 0.049, 0.06, 1], metallicFactor: 0.65, roughnessFactor: 0.4 },
    { name: "Kiln orange powder coat", baseColorFactor: [0.88, 0.19, 0.035, 1], metallicFactor: 0.42, roughnessFactor: 0.34 },
    { name: "Zinc hardware", baseColorFactor: [0.5, 0.55, 0.6, 1], metallicFactor: 0.93, roughnessFactor: 0.24 },
    { name: "Black rubber", baseColorFactor: [0.006, 0.007, 0.009, 1], metallicFactor: 0, roughnessFactor: 0.9 },
  ],
});

function box(center, size, material, bevel = 0.002) {
  model.addChamferedBox({ center, size, material, bevel });
}

function part(geometry, material, center, rotation = [0, 0, 0]) {
  model.addGeometry({
    vertices: Array.from(geometry.attributes.position.array),
    normals: Array.from(geometry.attributes.normal.array),
    indices: geometry.index ? Array.from(geometry.index.array) : Array.from({ length: geometry.attributes.position.count }, (_, i) => i),
    material, center, rotation,
  });
  geometry.dispose();
}

function polygon(points) {
  const shape = new Shape();
  points.forEach(([x, y], i) => i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y));
  shape.closePath();
  return shape;
}

function extrude(shape, depth, material, center, rotation) {
  part(new ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1, curveSegments: 6 }), material, center, rotation);
}

function cylinder(center, radius, length, axis, material = STEEL, segments = 12) {
  model.addCylinder({ center, radius, length, axis, material, segments });
}

function bolt(center, axis) {
  cylinder(center, 0.012, 0.002, axis);
  cylinder(center, 0.008, 0.009, axis, STEEL, 6);
}

// Real perforations through front/rear tube walls, with a hollow interior.
// The telescoping overlap is concealed by the collar, not by a full solid post.
function upright(x, bottom, top, width, holes, material) {
  const thickness = 0.003;
  const face = polygon([[-width / 2, bottom], [width / 2, bottom], [width / 2, top], [-width / 2, top]]);
  for (const y of holes) {
    const hole = new Path();
    hole.absarc(0, y, 0.0085, 0, Math.PI * 2, true);
    face.holes.push(hole);
  }
  for (const side of [-1, 1]) {
    extrude(face, thickness, material, [x, 0, 0.13 + side * width / 2 - (side > 0 ? thickness : 0)]);
    box([x + side * (width - thickness) / 2, (bottom + top) / 2, 0.13],
      [thickness, top - bottom, width - thickness * 2], material, 0.0008);
  }
}

function base(x) {
  // Two cross feet and a narrow longitudinal spine, not a solid footprint slab.
  box([x, 0.056, 0], [0.065, 0.065, 0.756], FRAME);
  for (const z of [-0.37, 0.37]) {
    box([x, 0.043, z], [0.306, 0.066, 0.07], FRAME);
    for (const end of [-1, 1]) {
      const capX = x + end * 0.143;
      box([capX, 0.04, z], [0.032, 0.08, 0.076], RUBBER, 0.004);
      for (let rib = 0; rib < 5; rib += 1) {
        box([capX, 0.012 + rib * 0.013, z], [0.034, 0.004, 0.08], RUBBER, 0.001);
      }
      bolt([x + end * 0.082, 0.044, z + Math.sign(z) * 0.035], "z");
    }
    bolt([x, 0.093, z], "y");
  }
  box([x, 0.096, 0.13], [0.105, 0.015, 0.14], FRAME);
  // Welded triangular gusset plates on both sides of the lower column.
  for (const side of [-1, 1]) {
    for (const direction of [-1, 1]) {
      const brace = polygon([[0, 0], [direction * 0.185, 0], [0, 0.235]]);
      extrude(brace, 0.006, FRAME, [x + side * 0.033 + 0.003, 0.102, 0.13], [0, -Math.PI / 2, 0]);
      box([x + side * 0.033, 0.106, 0.13 + direction * 0.09], [0.012, 0.007, 0.19], FRAME);
    }
  }
  bolt([x, 0.29, 0.089], "z");
}

function lockingPin(x, y, side) {
  cylinder([x, y, 0.13], 0.006, 0.108, "x");
  const pinX = x + side * 0.057;
  cylinder([pinX, y, 0.13], 0.012, 0.012, "x");
  part(new TorusGeometry(0.019, 0.002, 6, 20), STEEL, [pinX + side * 0.007, y - 0.019, 0.13], [0, Math.PI / 2, 0]);
}

function jCup(x, side) {
  box([x, 1.397, 0.087], [0.084, 0.156, 0.012], ORANGE);
  for (const edge of [-1, 1]) {
    box([x + edge * 0.043, 1.397, 0.128], [0.01, 0.156, 0.082], ORANGE);
  }
  // Bent hook profile: tall back, short forward retaining lip, open cradle.
  const hook = polygon([[0.081, 1.345], [-0.067, 1.345], [-0.09, 1.371], [-0.09, 1.413],
    [-0.075, 1.413], [-0.07, 1.38], [-0.056, 1.366], [0.067, 1.366], [0.067, 1.46], [0.081, 1.46]]);
  extrude(hook, 0.074, ORANGE, [x + 0.037, 0, 0], [0, -Math.PI / 2, 0]);
  box([x, 1.371, 0.005], [0.064, 0.01, 0.116], RUBBER);
  box([x, 1.413, 0.061], [0.064, 0.077, 0.01], RUBBER);
  lockingPin(x, 1.425, side);
}

function spotterArm(x, side) {
  box([x, 0.559, 0.083], [0.09, 0.146, 0.018], ORANGE);
  for (const edge of [-1, 1]) box([x + edge * 0.043, 0.559, 0.127], [0.01, 0.146, 0.088], ORANGE);
  box([x, 0.547, -0.107], [0.065, 0.046, 0.376], ORANGE);
  box([x, 0.575, -0.11], [0.057, 0.01, 0.35], RUBBER);
  box([x, 0.573, -0.307], [0.074, 0.092, 0.024], ORANGE);
  box([x, 0.582, -0.31], [0.078, 0.084, 0.026], RUBBER);
  for (const y of [0.506, 0.612]) bolt([x, y, 0.071], "z");
  lockingPin(x, 0.558, side);
  const support = polygon([[0.07, 0.505], [-0.085, 0.524], [0.07, 0.524]]);
  extrude(support, 0.008, ORANGE, [x + 0.004, 0, 0], [0, -Math.PI / 2, 0]);
}

// Canonical envelope: X ±0.54, Z ±0.41, Y 0..1.78 m. Front is negative Z.
// Both stands form one static planning asset; no crossbar or included barbell.
for (const side of [-1, 1]) {
  const x = side * 0.38;
  base(x);
  upright(x, 0.104, 1.405, 0.075, Array.from({ length: 18 }, (_, row) => 0.45 + row * 0.05), FRAME);
  upright(x, 1.38, 1.772, 0.055, [1.515, 1.575, 1.635, 1.695], STEEL);
  box([x, 1.776, 0.13], [0.062, 0.008, 0.062], RUBBER);
  for (const edge of [-1, 1]) {
    box([x + edge * 0.038, 1.399, 0.13], [0.006, 0.018, 0.082], RUBBER);
    box([x, 1.399, 0.13 + edge * 0.038], [0.07, 0.018, 0.006], RUBBER);
  }
  jCup(x, side);
  spotterArm(x, side);
}

model.orientFacesToNormals();
await writeProceduralGlb(model, OUTPUT);
