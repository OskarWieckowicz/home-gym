import { ExtrudeGeometry, Path, Shape, ShapeGeometry } from "three";
import { ProceduralGlb, writeProceduralGlb } from "./lib/procedural-glb.mjs";

const model = new ProceduralGlb({
  generator: "Home Gym Creator Groundwork Exercise Mat v1; fully deployed 65x180x1 cm",
  materials: [
    { name: "Groundwork charcoal foam edge", baseColorFactor: [0.017, 0.019, 0.022, 1], metallicFactor: 0, roughnessFactor: 0.93 },
    { name: "Groundwork matte exercise surface", baseColorFactor: [0.03, 0.033, 0.036, 1], metallicFactor: 0, roughnessFactor: 0.98 },
    { name: "Groundwork inset orange border", baseColorFactor: [0.58, 0.12, 0.025, 1], metallicFactor: 0, roughnessFactor: 0.86 },
  ],
});

function roundedRect(width, length, radius, path = new Shape()) {
  const x = width / 2, z = length / 2;
  path.moveTo(-x + radius, -z);
  path.lineTo(x - radius, -z);
  path.absarc(x - radius, -z + radius, radius, -Math.PI / 2, 0, false);
  path.lineTo(x, z - radius);
  path.absarc(x - radius, z - radius, radius, 0, Math.PI / 2, false);
  path.lineTo(-x + radius, z);
  path.absarc(-x + radius, z - radius, radius, Math.PI / 2, Math.PI, false);
  path.lineTo(-x, -z + radius);
  path.absarc(-x + radius, -z + radius, radius, Math.PI, Math.PI * 1.5, false);
  path.closePath();
  return path;
}

function addPart(geometry, material) {
  const indices = geometry.index ? [...geometry.index.array] : Array.from({ length: geometry.attributes.position.count }, (_, i) => i);
  model.addGeometry({ material, vertices: [...geometry.attributes.position.array],
    normals: [...geometry.attributes.normal.array], indices });
  geometry.dispose();
}

// XY outline becomes XZ after rotation; extrusion points upward, with bottom at zero.
const body = new ExtrudeGeometry(roundedRect(0.647, 1.797, 0.037), {
  depth: 0.0065, steps: 1, curveSegments: 10,
  bevelEnabled: true, bevelSegments: 3, bevelSize: 0.0015, bevelThickness: 0.0015,
});
body.rotateX(-Math.PI / 2);
body.translate(0, 0.0015, 0);
addPart(body, 0);

const surface = new ShapeGeometry(roundedRect(0.64, 1.79, 0.035), 10);
surface.rotateX(-Math.PI / 2);
surface.translate(0, 0.0096, 0);
addPart(surface, 1);

// A two-millimeter inset stripe, not a thick raised tube around the usable surface.
const stripe = roundedRect(0.626, 1.776, 0.031);
stripe.holes.push(roundedRect(0.622, 1.772, 0.029, new Path()));
const border = new ShapeGeometry(stripe, 10);
border.rotateX(-Math.PI / 2);
border.translate(0, 0.01, 0);
addPart(border, 2);

await writeProceduralGlb(model, process.argv[2] ?? "public/assets/groundwork-exercise-mat.glb");
