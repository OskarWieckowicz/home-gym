import {
  CurvePath, CylinderGeometry, ExtrudeGeometry, LineCurve3, QuadraticBezierCurve3,
  Quaternion, Shape, TubeGeometry, Vector3,
} from "three";
import { ProceduralGlb, writeProceduralGlb } from "./lib/procedural-glb.mjs";

const FRAME = 0, UPPER = 1, RUBBER = 2, STEEL = 3;
const model = new ProceduralGlb({
  generator: "Home Gym Creator freestanding dip bars v1; static adjustable pair, fictional planning model",
  materials: [
    { name: "Dip graphite sleeves and feet", baseColorFactor: [0.045, 0.051, 0.06, 1], metallicFactor: 0.65, roughnessFactor: 0.4 },
    { name: "Dip satin upper rails", baseColorFactor: [0.08, 0.088, 0.1, 1], metallicFactor: 0.7, roughnessFactor: 0.34 },
    { name: "Dip black grips and controls", baseColorFactor: [0.012, 0.014, 0.017, 1], metallicFactor: 0.03, roughnessFactor: 0.82 },
    { name: "Dip steel collars and bolts", baseColorFactor: [0.48, 0.52, 0.57, 1], metallicFactor: 0.88, roughnessFactor: 0.3 },
  ],
});

function part(geometry, material) {
  const indices = geometry.index ? [...geometry.index.array] : Array.from({ length: geometry.attributes.position.count }, (_, i) => i);
  model.addGeometry({ material, vertices: [...geometry.attributes.position.array],
    normals: [...geometry.attributes.normal.array], indices });
  geometry.dispose();
}

function rod(a, b, radius, { material, segments = 16 }) {
  const start = new Vector3(...a), end = new Vector3(...b);
  const span = end.clone().sub(start);
  const geometry = new CylinderGeometry(radius, radius, span.length(), segments);
  geometry.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), span.normalize()));
  geometry.translate(...start.add(end).multiplyScalar(0.5).toArray());
  part(geometry, material);
}

function box(center, size, material, bevel = 0.004) {
  model.addChamferedBox({ center, size, material, bevel });
}

function knob(x, y, z, side) {
  rod([x, y, z], [x + side * 0.024, y, z], 0.005, { material: STEEL, segments: 10 });
  const shape = new Shape();
  for (let i = 0; i < 10; i += 1) {
    const angle = i * Math.PI / 5, radius = i % 2 ? 0.018 : 0.025;
    const point = [Math.cos(angle) * radius, Math.sin(angle) * radius];
    if (i === 0) shape.moveTo(...point); else shape.lineTo(...point);
  }
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, { depth: 0.014, steps: 1,
    bevelEnabled: true, bevelSegments: 1, bevelSize: 0.002, bevelThickness: 0.002 });
  geometry.rotateY(side * Math.PI / 2);
  geometry.translate(x + side * 0.018, y, z);
  part(geometry, RUBBER);
}

// One placement envelope: X ±.60, Z ±.40, Y 0..1.10 m. Empty middle stays reserved.
for (const x of [-0.33, 0.33]) {
  const side = Math.sign(x);
  for (const z of [-0.36, 0.36]) {
    box([x, 0.029, z], [0.52, 0.05, 0.07], FRAME);
    for (const end of [-1, 1]) {
      const capX = x + end * 0.2475;
      box([capX, 0.028, z], [0.045, 0.056, 0.08], RUBBER);
      // Subtle cap ribs remain readable without texture downloads.
      for (let i = -1; i <= 1; i += 1) {
        box([capX + i * 0.009, 0.0565, z], [0.003, 0.003, 0.068], RUBBER, 0.001);
      }
    }
    box([x, 0.056, z], [0.092, 0.012, 0.062], FRAME);
    for (const offset of [-0.034, 0.034]) {
      rod([x + offset, 0.062, z], [x + offset, 0.069, z], 0.0065, { material: STEEL, segments: 6 });
    }
    rod([x, 0.061, z], [x, 0.638, z], 0.028, { material: FRAME, segments: 20 });
    rod([x, 0.633, z], [x, 0.643, z], 0.029, { material: STEEL, segments: 20 });
    rod([x, 0.641, z], [x, 0.649, z], 0.026, { material: RUBBER, segments: 20 });
    knob(x + side * 0.027, 0.595, z, side);
    // Dark inset-like disks approximate drill holes; no expensive boolean cutouts.
    for (let i = 0; i < 5; i += 1) {
      const y = 0.688 + i * 0.051;
      rod([x + side * 0.0214, y, z], [x + side * 0.0221, y, z], 0.0045, { material: RUBBER, segments: 10 });
      rod([x, y, z + Math.sign(z) * 0.0214], [x, y, z + Math.sign(z) * 0.0221], 0.0045, { material: RUBBER, segments: 10 });
    }
  }
  // Continuous inverted-U tube with smooth bends, not disconnected elbow blocks.
  const v = (y, z) => new Vector3(x, y, z);
  const path = new CurvePath();
  path.add(new LineCurve3(v(0.615, -0.36), v(0.974, -0.36)));
  path.add(new QuadraticBezierCurve3(v(0.974, -0.36), v(1.074, -0.36), v(1.074, -0.26)));
  path.add(new LineCurve3(v(1.074, -0.26), v(1.074, 0.26)));
  path.add(new QuadraticBezierCurve3(v(1.074, 0.26), v(1.074, 0.36), v(0.974, 0.36)));
  path.add(new LineCurve3(v(0.974, 0.36), v(0.615, 0.36)));
  part(new TubeGeometry(path, 72, 0.022, 16, false), UPPER);
  rod([x, 1.074, -0.235], [x, 1.074, 0.235], 0.026, { material: RUBBER, segments: 20 });
  // Raised end bands on the grip keep the model legible at room-view scale.
  for (const z of [-0.226, 0.226]) rod([x, 1.074, z - 0.004], [x, 1.074, z + 0.004], 0.026, { material: RUBBER, segments: 20 });
}

await writeProceduralGlb(model, process.argv[2] ?? "public/assets/freestanding-dip-bars.glb");
