import { CylinderGeometry, Quaternion, TorusGeometry, Vector3 } from "three";
import { ProceduralGlb, writeProceduralGlb } from "./lib/procedural-glb.mjs";

const FRAME = 0, STEEL = 1, RUBBER = 2, ORANGE = 3, PLATE = 4;
const model = new ProceduralGlb({
  generator: "Home Gym Creator Loop cable trainer v1; single-handle fictional presentation model",
  materials: [
    { name: "Loop graphite frame", baseColorFactor: [0.04, 0.046, 0.055, 1], metallicFactor: 0.7, roughnessFactor: 0.36 },
    { name: "Loop brushed steel", baseColorFactor: [0.53, 0.57, 0.61, 1], metallicFactor: 0.88, roughnessFactor: 0.3 },
    { name: "Loop cables and handle", baseColorFactor: [0.009, 0.011, 0.013, 1], metallicFactor: 0.05, roughnessFactor: 0.78 },
    { name: "Loop orange controls", baseColorFactor: [0.95, 0.2, 0.025, 1], metallicFactor: 0.3, roughnessFactor: 0.38 },
    { name: "Loop stack plates", baseColorFactor: [0.072, 0.078, 0.084, 1], metallicFactor: 0.55, roughnessFactor: 0.5 },
  ],
});

function part(mesh, material) {
  model.addGeometry({ material, vertices: [...mesh.attributes.position.array],
    normals: [...mesh.attributes.normal.array], indices: [...mesh.index.array] });
  mesh.dispose();
}

function rod(a, b, { radius = 0.008, material = FRAME, segments = 12 } = {}) {
  const start = new Vector3(...a), end = new Vector3(...b);
  const span = end.clone().sub(start);
  const cylinder = new CylinderGeometry(radius, radius, span.length(), segments);
  cylinder.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), span.normalize()));
  cylinder.translate(...start.add(end).multiplyScalar(0.5).toArray());
  part(cylinder, material);
}

function block(center, size, material = FRAME) {
  model.addBox({ center, size, material });
}

function rounded(center, size, material = RUBBER) {
  model.addChamferedBox({ center, size, material, bevel: Math.min(0.009, size[2] / 4) });
}

function bolt(x, y, z) {
  rod([x, y, z], [x, y, z - 0.006], { radius: 0.008, material: STEEL, segments: 6 });
}

function wheel(center, radius = 0.035) {
  const [x, y, z] = center;
  rod([x - 0.012, y, z], [x + 0.012, y, z], { radius: radius - 0.003, material: RUBBER, segments: 20 });
  for (const sign of [-1, 1]) {
    rod([x + sign * 0.012, y, z], [x + sign * 0.019, y, z], { radius, segments: 20 });
    rod([x + sign * 0.019, y, z], [x + sign * 0.026, y, z], { radius: 0.008, material: STEEL, segments: 6 });
  }
}

const wire = (a, b) => rod(a, b, { radius: 0.0025, material: RUBBER, segments: 8 });

// Fixed 0.62 x 0.28 x 2.05 m envelope. Feet reach X ±.31, Z ±.14; cap reaches Y 2.05.
rounded([0, 0.016, -0.1], [0.62, 0.032, 0.08]);
block([0, 0.05, -0.1], [0.59, 0.05, 0.058]);
rounded([0, 0.016, 0.105], [0.32, 0.032, 0.07]);
block([0, 0.05, 0.085], [0.30, 0.05, 0.06]);
block([0, 0.065, 0], [0.075, 0.045, 0.23]);
for (const x of [-0.27, 0.27]) {
  rod([x, 0.07, -0.1], [x, 0.079, -0.1], { radius: 0.011, material: STEEL, segments: 6 });
}

// Single adjustment rail slightly offset from the stack centre, leaving the plates legible.
const railX = -0.075;
block([railX, 1.0525, -0.062], [0.05, 1.955, 0.045], STEEL);
block([railX, 2.04, -0.062], [0.068, 0.02, 0.062]);
block([railX, 0.14, -0.062], [0.078, 0.12, 0.068]);
for (let i = 0; i < 26; i += 1) {
  const y = 0.24 + i * 0.066;
  rod([railX, y, -0.085], [railX, y, -0.087], { radius: 0.006, material: RUBBER, segments: 10 });
}
for (const y of [0.12, 1.99]) bolt(railX, y, -0.089);
block([0.065, 1.05, 0.095], [0.058, 1.95, 0.05]);
block([-0.005, 2.014, 0.02], [0.20, 0.052, 0.19]);
block([0.025, 1.894, 0.042], [0.23, 0.038, 0.08]);

// Two mounting ears behind the upright, with inset fastener holes; no added wall object.
for (const y of [0.36, 1.72]) {
  block([0.13, y, 0.11], [0.15, 0.045, 0.034]);
  block([0.19, y, 0.13], [0.035, 0.08, 0.02]);
  rod([0.19, y, 0.119], [0.19, y, 0.141 - 0.002], { radius: 0.008, material: RUBBER });
  bolt(0.07, y, 0.087);
}

// One weight stack, 18 separated plates; guide rods and selector hardware are static.
for (const x of [-0.025, 0.115]) {
  rod([x, 0.095, 0.036], [x, 1.91, 0.036], { radius: 0.008, material: STEEL });
}
for (let i = 0; i < 18; i += 1) {
  const y = 0.145 + i * 0.033;
  rounded([0.045, y, 0.028], [0.26, 0.028, 0.115], PLATE);
  rod([0.07, y, -0.031], [0.07, y, -0.034], { radius: 0.005, material: RUBBER, segments: 8 });
}
block([0.045, 0.747, 0.028], [0.24, 0.04, 0.105], PLATE);
rod([0.07, 0.31, -0.028], [0.07, 0.31, -0.055], { radius: 0.01, material: STEEL });
rod([0.07, 0.31, -0.055], [0.07, 0.31, -0.069], { radius: 0.017, material: ORANGE });
rod([0.045, 0.765, 0.026], [0.045, 0.822, 0.026], { radius: 0.012, material: STEEL });
wheel([0.045, 0.847, 0.026], 0.032);
wheel([0.045, 1.959, 0.026], 0.038);
wire([0.045, 0.847, -0.003], [0.045, 1.959, -0.009]);
wire([0.045, 0.847, 0.055], [0.045, 1.959, 0.061]);

// Single carriage at chest height. One outlet and ONE open triangular D-handle.
block([railX, 1.255, -0.063], [0.072, 0.19, 0.07]);
rounded([-0.133, 1.255, -0.075], [0.022, 0.215, 0.108], FRAME);
rounded([-0.177, 1.255, -0.075], [0.012, 0.215, 0.108], FRAME);
for (const y of [1.2, 1.31]) wheel([-0.154, y, -0.074], 0.037);
block([-0.13, 1.255, -0.037], [0.095, 0.07, 0.028]);
rod([-0.134, 1.263, -0.107], [-0.134, 1.263, -0.128], { radius: 0.012, material: STEEL });
rod([-0.134, 1.263, -0.122], [-0.134, 1.263, -0.137], { radius: 0.022, material: ORANGE });
wire([-0.154, 1.2, -0.108], [-0.154, 1.09, -0.114]);
rod([-0.154, 1.104, -0.114], [-0.154, 1.081, -0.114], { radius: 0.009, material: RUBBER });
const connector = new TorusGeometry(0.014, 0.003, 6, 16);
connector.scale(0.72, 1.3, 1);
connector.translate(-0.154, 1.065, -0.114);
part(connector, STEEL);
rod([-0.154, 1.048, -0.114], [-0.216, 0.919, -0.114], { radius: 0.006, material: RUBBER });
rod([-0.154, 1.048, -0.114], [-0.092, 0.919, -0.114], { radius: 0.006, material: RUBBER });
rod([-0.219, 0.919, -0.114], [-0.089, 0.919, -0.114], { radius: 0.013, material: RUBBER, segments: 16 });

// Visible routing only; internal paths intentionally simplified for room-view readability.
wheel([railX, 1.975, -0.062], 0.033);
wheel([railX, 0.16, -0.018], 0.027);
wire([railX, 0.16, 0.006], [railX, 1.975, -0.032]);
wire([railX, 0.16, -0.042], [-0.154, 1.2, -0.04]);
wire([-0.154, 1.31, -0.107], [railX, 1.975, -0.092]);
wire([railX, 2.005, -0.062], [0.045, 1.994, 0.026]);

await writeProceduralGlb(model, process.argv[2] ?? "public/assets/loop-cable-trainer.glb");
