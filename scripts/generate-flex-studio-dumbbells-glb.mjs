import { Color, ExtrudeGeometry, LatheGeometry, Shape, Vector2 } from "three";
import { ProceduralGlb, writeProceduralGlb } from "./lib/procedural-glb.mjs";

const model = new ProceduralGlb({
  generator: "Home Gym Creator Flex Studio Dumbbells v1; six coated weights in a compact static display",
  materials: [
    ["Flex coral coating", "#f18477"],
    ["Flex sage coating", "#a1b582"],
    ["Flex blue coating", "#7e9dc1"],
  ].map(([name, color]) => ({ name, baseColorFactor: [...new Color(color).toArray(), 1],
    metallicFactor: 0, roughnessFactor: 0.83 })),
});

function roundedHex() {
  const points = Array.from({ length: 6 }, (_, i) => new Vector2(Math.cos(i * Math.PI / 3), Math.sin(i * Math.PI / 3)));
  const shape = new Shape();
  for (let i = 0; i < points.length; i += 1) {
    const corner = points[i];
    const before = corner.clone().lerp(points[(i + 5) % 6], 0.18);
    const after = corner.clone().lerp(points[(i + 1) % 6], 0.18);
    if (i === 0) shape.moveTo(before.x, before.y); else shape.lineTo(before.x, before.y);
    shape.quadraticCurveTo(corner.x, corner.y, after.x, after.y);
  }
  shape.closePath();
  return shape;
}

function head(width, thickness) {
  const geometry = new ExtrudeGeometry(roundedHex(), { depth: 0.75, steps: 1,
    curveSegments: 4, bevelEnabled: true, bevelSegments: 3, bevelSize: 0.13, bevelThickness: 0.13 });
  geometry.center();
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox;
  // Parametric head dimensions, with a flat floor-facing hex face and rounded corners.
  geometry.scale(width / (max.x - min.x), width * Math.sqrt(3) / 2 / (max.y - min.y), thickness / (max.z - min.z));
  geometry.rotateY(Math.PI / 2);
  return geometry;
}

function grip(length, radius) {
  const points = Array.from({ length: 17 }, (_, i) => {
    const t = i / 16;
    return new Vector2(radius * (1 + 0.5 * Math.pow(Math.abs(t * 2 - 1), 3)), (t - 0.5) * length);
  });
  const geometry = new LatheGeometry(points, 24);
  geometry.rotateZ(-Math.PI / 2);
  return geometry;
}

function addPart(geometry, { center, upright, material }) {
  if (upright) geometry.rotateZ(Math.PI / 2);
  geometry.translate(...center);
  const indices = geometry.index ? [...geometry.index.array] : Array.from({ length: geometry.attributes.position.count }, (_, i) => i);
  model.addGeometry({ material, vertices: [...geometry.attributes.position.array],
    normals: [...geometry.attributes.normal.array], indices });
  geometry.dispose();
}

function dumbbell({ length, width, thickness, radius, ...pose }) {
  for (const end of [-1, 1]) {
    const geometry = head(width, thickness);
    geometry.translate(end * (length - thickness) / 2, 0, 0);
    addPart(geometry, pose);
  }
  // Grip overlaps each solid head slightly; its open ends are fully buried.
  addPart(grip(length - 2 * thickness + 0.004, radius), pose);
}

// Six separate weights, two per colour. Authored bounds X ±.23, Z ±.12, Y 0...18m.
// Upright coral pair supplies the catalog height without inventing a stand or changing the seed.
for (const x of [-0.12, 0.12]) {
  dumbbell({ material: 0, center: [x, 0.09, -0.087], upright: true,
    length: 0.18, width: 0.066, thickness: 0.033, radius: 0.012 });
  dumbbell({ material: 1, center: [x, 0.075 * Math.sqrt(3) / 4, -0.015], upright: false,
    length: 0.20, width: 0.075, thickness: 0.04, radius: 0.014 });
  dumbbell({ material: 2, center: [x, 0.09 * Math.sqrt(3) / 4, 0.075], upright: false,
    length: 0.22, width: 0.09, thickness: 0.045, radius: 0.016 });
}

await writeProceduralGlb(model, process.argv[2] ?? "public/assets/flex-studio-dumbbells.glb");
