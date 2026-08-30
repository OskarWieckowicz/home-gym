import { BoxGeometry, CylinderGeometry, LatheGeometry, Quaternion, TorusGeometry, Vector2, Vector3 } from "three";
import { ProceduralGlb, writeProceduralGlb } from "./lib/procedural-glb.mjs";

const FRAME = 0, BAG = 1, TRIM = 2, STEEL = 3;
const model = new ProceduralGlb({
  generator: "Home Gym Creator wall-mounted punching bag v1; fictional static planning model",
  materials: [
    { name: "Bag bracket graphite steel", baseColorFactor: [0.025, 0.031, 0.039, 1], metallicFactor: 0.65, roughnessFactor: 0.4 },
    { name: "Bag charcoal upholstery", baseColorFactor: [0.015, 0.018, 0.022, 1], metallicFactor: 0, roughnessFactor: 0.76 },
    { name: "Bag reinforced seams and tabs", baseColorFactor: [0.032, 0.035, 0.04, 1], metallicFactor: 0, roughnessFactor: 0.84 },
    { name: "Bag zinc chains and fasteners", baseColorFactor: [0.46, 0.51, 0.57, 1], metallicFactor: 0.9, roughnessFactor: 0.28 },
  ],
});

function part(geometry, material) {
  const indices = geometry.index ? [...geometry.index.array] : Array.from({ length: geometry.attributes.position.count }, (_, i) => i);
  model.addGeometry({ material, vertices: [...geometry.attributes.position.array],
    normals: [...geometry.attributes.normal.array], indices });
  geometry.dispose();
}

function spanGeometry(geometry, a, b, material) {
  const start = new Vector3(...a), end = new Vector3(...b);
  geometry.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), end.clone().sub(start).normalize()));
  geometry.translate(...start.add(end).multiplyScalar(0.5).toArray());
  part(geometry, material);
}

function beam(a, b, width, depth) {
  spanGeometry(new BoxGeometry(width, new Vector3(...a).distanceTo(new Vector3(...b)), depth), a, b, FRAME);
}

function rod(a, b, radius, material = STEEL) {
  spanGeometry(new CylinderGeometry(radius, radius, new Vector3(...a).distanceTo(new Vector3(...b)), 10), a, b, material);
}

function ring(center, { radius, tube = 0.003, rotation = [0, 0, 0], scale = [1, 1, 1], material = STEEL, segments = 20 }) {
  const geometry = new TorusGeometry(radius, tube, 6, segments);
  geometry.scale(...scale);
  geometry.rotateX(rotation[0]); geometry.rotateY(rotation[1]); geometry.rotateZ(rotation[2]);
  geometry.translate(...center);
  part(geometry, material);
}

function chain(a, b) {
  const start = new Vector3(...a), end = new Vector3(...b);
  const direction = end.clone().sub(start);
  const count = Math.ceil(direction.length() / 0.036);
  const orientation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize());
  for (let i = 0; i <= count; i += 1) {
    const link = new TorusGeometry(0.012, 0.0028, 6, 16);
    link.scale(1, 1.85, 1);
    link.rotateY(i % 2 ? Math.PI / 2 : 0);
    link.applyQuaternion(orientation);
    link.translate(...start.clone().lerp(end, i / count).toArray());
    part(link, STEEL);
  }
}

// Local envelope X ±.30, Z ±.60, Y 0..1.90 m. The renderer adds mounting height.
const bagZ = -0.4;
const profile = [[0, 0], [0.15, 0], [0.18, 0.015], [0.195, 0.04], [0.2, 0.075],
  [0.2, 1.245], [0.196, 1.28], [0.182, 1.305], [0.15, 1.32], [0, 1.32]];
const body = new LatheGeometry(profile.map(([x, y]) => new Vector2(x, y)), 48);
body.translate(0, 0, bagZ);
part(body, BAG);
for (const y of [0.065, 0.08, 1.245, 1.26]) {
  ring([0, y, bagZ], { radius: 0.198, tube: 0.0018, rotation: [Math.PI / 2, 0, 0], material: TRIM, segments: 48 });
}
for (const angle of [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4]) {
  const x = Math.sin(angle), z = Math.cos(angle);
  rod([x * 0.199, 0.08, bagZ + z * 0.199], [x * 0.199, 1.245, bagZ + z * 0.199], 0.0014, TRIM);
  model.addChamferedBox({ center: [x * 0.2, 1.21, bagZ + z * 0.2], size: [0.049, 0.155, 0.008],
    bevel: 0.003, rotation: [0, angle, 0], material: TRIM });
  for (const y of [1.158, 1.23]) {
    rod([x * 0.203, y, bagZ + z * 0.203], [x * 0.209, y, bagZ + z * 0.209], 0.0045);
  }
  ring([x * 0.19, 1.316, bagZ + z * 0.19], { radius: 0.02, rotation: [0, angle, 0], scale: [1, 1.25, 1] });
  chain([x * 0.188, 1.339, bagZ + z * 0.188], [x * 0.012, 1.731, bagZ + z * 0.012]);
}
ring([0, 1.759, bagZ], { radius: 0.026, tube: 0.004 });
rod([0, 1.777, bagZ], [0, 1.824, bagZ], 0.009);
ring([0, 1.81, bagZ], { radius: 0.017, rotation: [0, Math.PI / 2, 0] });

// Rear faces of all wall plates are flush at +.60. Twin braces spread laterally.
model.addChamferedBox({ center: [0, 1.68, 0.59], size: [0.14, 0.44, 0.02], bevel: 0.005, material: FRAME });
model.addChamferedBox({ center: [0, 1.851, 0.06], size: [0.075, 0.075, 1.055], bevel: 0.004, material: FRAME });
for (const x of [-0.25, 0.25]) {
  model.addChamferedBox({ center: [x, 0.89, 0.59], size: [0.1, 0.2, 0.02], bevel: 0.005, material: FRAME });
  beam([x, 0.9, 0.56], [Math.sign(x) * 0.023, 1.815, -0.10], 0.032, 0.036);
  for (const y of [0.828, 0.955]) rod([x, y, 0.578], [x, y, 0.564], 0.01);
}
for (const x of [-0.045, 0.045]) {
  for (const y of [1.51, 1.85]) rod([x, y, 0.578], [x, y, 0.564], 0.01);
}
// Small welded saddle and closed tip of the square boom.
model.addChamferedBox({ center: [0, 1.81, -0.1], size: [0.096, 0.02, 0.09], bevel: 0.004, material: FRAME });
model.addBox({ center: [0, 1.851, -0.47], size: [0.075, 0.075, 0.006], material: TRIM });

await writeProceduralGlb(model, process.argv[2] ?? "public/assets/wall-mounted-punching-bag.glb");
