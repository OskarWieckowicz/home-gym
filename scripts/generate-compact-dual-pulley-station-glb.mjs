import { BoxGeometry, CylinderGeometry, Quaternion, TorusGeometry, Vector3 } from "three";
import { ProceduralGlb, writeProceduralGlb } from "./lib/procedural-glb.mjs";

const OUTPUT = process.argv[2] ?? "public/assets/compact-dual-pulley-station.glb";
const M = { frame: 0, steel: 1, rubber: 2, orange: 3, stack: 4 };
const model = new ProceduralGlb({
  generator: "Home Gym Creator Compact Dual-Pulley Station generator v1; fictional standalone asset",
  materials: [
    { name: "Graphite station frame", baseColorFactor: [0.038, 0.045, 0.054, 1], metallicFactor: 0.7, roughnessFactor: 0.34 },
    { name: "Brushed rails and hardware", baseColorFactor: [0.5, 0.55, 0.59, 1], metallicFactor: 0.88, roughnessFactor: 0.29 },
    { name: "Black cables and grips", baseColorFactor: [0.008, 0.01, 0.012, 1], metallicFactor: 0.06, roughnessFactor: 0.75 },
    { name: "Orange adjustment controls", baseColorFactor: [0.95, 0.19, 0.025, 1], metallicFactor: 0.35, roughnessFactor: 0.35 },
    { name: "Dark selectorized plates", baseColorFactor: [0.07, 0.075, 0.08, 1], metallicFactor: 0.6, roughnessFactor: 0.5 },
  ],
});

function geometryPart(geometry, material) {
  model.addGeometry({
    vertices: Array.from(geometry.getAttribute("position").array),
    normals: Array.from(geometry.getAttribute("normal").array),
    indices: Array.from(geometry.index.array), material,
  });
  geometry.dispose();
}

const box = (center, size, material = M.frame) => model.addBox({ center, size, material });
const pad = (center, size, material = M.rubber, bevel = 0.012) => {
  model.addChamferedBox({ center, size, material, bevel });
};

// Arbitrary-axis bars keep diagonal members and their end joints connected.
function between(start, end, material, { radius, rectangular = false }) {
  const a = new Vector3(...start), b = new Vector3(...end);
  const direction = b.clone().sub(a);
  const geometry = rectangular
    ? new BoxGeometry(radius, direction.length(), radius)
    : new CylinderGeometry(radius, radius, direction.length(), 10);
  geometry.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()));
  geometry.translate(...a.add(b).multiplyScalar(0.5).toArray());
  geometryPart(geometry, material);
}

const tube = (start, end, radius = 0.016, material = M.frame) => between(start, end, material, { radius });
const beam = (start, end, width = 0.06) => between(start, end, M.frame, { radius: width, rectangular: true });
const cable = (start, end) => tube(start, end, 0.003, M.rubber);

function disc(center, radius, length, { material, axis = "x", segments = 12 }) {
  const geometry = new CylinderGeometry(radius, radius, length, segments);
  if (axis === "x") geometry.rotateZ(Math.PI / 2);
  if (axis === "z") geometry.rotateX(Math.PI / 2);
  geometry.translate(...center);
  geometryPart(geometry, material);
}

function ring(center, radius, thickness, material) {
  const geometry = new TorusGeometry(radius, thickness, 6, 16);
  geometry.translate(...center);
  geometryPart(geometry, material);
}

function pulley(x, y, z, radius = 0.048) {
  disc([x, y, z], radius - 0.004, 0.026, { material: M.rubber });
  for (const side of [-1, 1]) {
    disc([x + side * 0.017, y, z], radius, 0.008, { material: M.frame, segments: 16 });
    disc([x + side * 0.025, y, z], 0.009, 0.01, { material: M.steel });
  }
}

function handle(x) {
  // Open carabiner silhouette and triangular webbing, not a solid handle plate.
  ring([x, 1.388, -0.401], 0.018, 0.003, M.steel);
  tube([x, 1.371, -0.401], [x - 0.069, 1.235, -0.401], 0.007, M.rubber);
  tube([x, 1.371, -0.401], [x + 0.069, 1.235, -0.401], 0.007, M.rubber);
  tube([x - 0.072, 1.235, -0.401], [x + 0.072, 1.235, -0.401], 0.014, M.rubber);
  for (const side of [-1, 1]) disc([x + side * 0.07, 1.235, -0.401], 0.017, 0.008, { material: M.frame });
}

function carriage(side) {
  const x = side * 0.64;
  box([x, 1.58, -0.264], [0.095, 0.245, 0.105]);
  for (const offset of [-0.042, 0.042]) {
    pad([x + offset, 1.58, -0.339], [0.014, 0.235, 0.12], M.frame, 0.005);
  }
  pulley(x, 1.53, -0.351);
  pulley(x, 1.63, -0.351);
  disc([x + side * 0.067, 1.59, -0.269], 0.014, 0.06, { material: M.steel });
  disc([x + side * 0.092, 1.59, -0.269], 0.027, 0.028, { material: M.orange });
  // A fixed grab loop gives the carriage a readable adjustment mechanism.
  const grabX = x - side * 0.073;
  tube([x, 1.67, -0.245], [grabX, 1.67, -0.245], 0.009);
  tube([grabX, 1.67, -0.245], [grabX, 1.49, -0.245], 0.009);
  tube([grabX, 1.49, -0.245], [x, 1.49, -0.245], 0.009);
  cable([x, 1.53, -0.397], [x, 1.409, -0.401]);
  disc([x, 1.421, -0.401], 0.012, 0.023, { material: M.rubber, axis: "y" });
  handle(x);
}

function resistanceStack(side) {
  const x = side * 0.17;
  for (const offset of [-0.068, 0.068]) {
    tube([x + offset, 0.16, 0.31], [x + offset, 2.03, 0.31], 0.009, M.steel);
  }
  for (let row = 0; row < 18; row += 1) {
    const y = 0.195 + row * 0.031;
    pad([x, y, 0.31], [0.24, 0.027, 0.23], M.stack, 0.012);
    disc([x, y, 0.191], 0.005, 0.005, { material: M.rubber, axis: "z", segments: 8 });
  }
  box([x, 0.775, 0.31], [0.22, 0.05, 0.21], M.stack);
  tube([x, 0.8, 0.31], [x, 0.91, 0.31], 0.014, M.steel);
  pulley(x, 0.94, 0.31, 0.04);
  disc([x, 0.38, 0.175], 0.013, 0.025, { material: M.orange, axis: "z" });
  pulley(x, 2.055, 0.31, 0.043);
  cable([x, 0.94, 0.271], [x, 2.055, 0.268]);
  cable([x, 0.94, 0.349], [x, 2.055, 0.352]);
}

// Authored fictional envelope: X ±0.80, Z ±0.50, Y 0..2.20 m. Front = -Z.
// No post-export stretching: rails, wheels and grips retain their intended sections.
for (const side of [-1, 1]) {
  const x = side * 0.64;
  pad([side * 0.70, 0.018, -0.40], [0.20, 0.036, 0.20]);
  pad([side * 0.27, 0.018, 0.41], [0.20, 0.036, 0.18]);
  beam([side * 0.17, 0.075, 0.35], [side * 0.70, 0.075, -0.40], 0.075);
  beam([side * 0.27, 0.07, 0.41], [side * 0.27, 0.07, 0.26], 0.07);
  box([x, 1.13, -0.27], [0.055, 2.08, 0.065], M.steel);
  box([x, 2.185, -0.27], [0.078, 0.03, 0.088]);
  box([x, 0.17, -0.27], [0.09, 0.19, 0.11]);
  beam([x, 0.105, -0.34], [x, 0.36, -0.27], 0.04);
  box([side * 0.32, 1.115, 0.34], [0.055, 2.06, 0.065]);
  beam([side * 0.32, 2.12, 0.34], [x, 2.12, -0.27], 0.065);
  box([x, 2.105, -0.27], [0.105, 0.14, 0.12]);
  for (const y of [0.17, 2.105]) disc([x, y, -0.336], 0.013, 0.012, { material: M.steel, axis: "z", segments: 6 });
  for (let row = 0; row < 24; row += 1) {
    disc([x, 0.37 + row * 0.069, -0.304], 0.007, 0.003, { material: M.rubber, axis: "z", segments: 8 });
  }
  for (const z of [-0.42, 0.42]) {
    disc([side * (z < 0 ? 0.70 : 0.27), 0.045, z], 0.012, 0.016, { material: M.steel, axis: "y", segments: 6 });
  }
  carriage(side);
  resistanceStack(side);
  // Visible return run and top routing; hidden paths are intentionally simplified.
  pulley(x, 2.06, -0.20, 0.04);
  pulley(x, 0.175, -0.205, 0.035);
  cable([x, 0.175, -0.17], [x, 2.06, -0.16]);
  cable([x, 0.175, -0.24], [x, 1.52, -0.24]);
  cable([x, 1.68, -0.31], [x, 2.06, -0.24]);
  cable([x, 2.098, -0.20], [side * 0.17, 2.098, 0.31]);
  tube([side * 0.17, 2.055, 0.31], [side * 0.32, 2.055, 0.34], 0.013, M.steel);

  // Bent multi-grip pull-up bar and inward neutral-grip branches.
  tube([side * 0.63, 2.14, -0.29], [side * 0.46, 2.178, -0.38], 0.019);
  tube([side * 0.46, 2.178, -0.38], [side * 0.20, 2.178, -0.38], 0.019, M.rubber);
  tube([side * 0.20, 2.178, -0.38], [side * 0.12, 2.13, -0.43], 0.019, M.rubber);
  tube([side * 0.30, 2.14, -0.24], [side * 0.30, 2.14, -0.44], 0.017, M.rubber);
}

box([0, 0.105, 0.35], [0.695, 0.07, 0.085]);
box([0, 2.12, 0.34], [0.695, 0.065, 0.065]);
box([0, 2.12, -0.27], [1.335, 0.065, 0.065]);

// Shared central shroud, open side windows reveal plates and guide rods.
box([0, 1.155, 0.156], [0.34, 1.87, 0.024]);
box([0, 1.155, 0.456], [0.61, 1.87, 0.018]);
for (const side of [-1, 1]) {
  box([side * 0.312, 1.16, 0.34], [0.022, 1.85, 0.26]);
  for (const y of [0.25, 2.05]) disc([side * 0.14, y, 0.137], 0.01, 0.014, { material: M.steel, axis: "z", segments: 6 });
}
for (const y of [0.23, 2.075]) box([0, y, 0.31], [0.645, 0.035, 0.305]);
// A restrained set of inset ventilation slots is enough at room-view scale.
for (let row = 0; row < 12; row += 1) {
  for (const y of [0.34 + row * 0.031, 1.57 + row * 0.031]) {
    box([0, y, 0.142], [0.22, 0.009, 0.004], M.rubber);
    box([0, y, 0.467], [0.43, 0.009, 0.004], M.rubber);
  }
}

await writeProceduralGlb(model, OUTPUT);
