import { CubicBezierCurve3, CurvePath, CylinderGeometry, LatheGeometry, TubeGeometry, Vector2, Vector3 } from "three";
import { ProceduralGlb, writeProceduralGlb } from "./lib/procedural-glb.mjs";

const OUTPUT = process.argv[2] ?? "public/assets/forge-kettlebell-16kg.glb";
const model = new ProceduralGlb({
  generator: "Home Gym Creator Forge Kettlebell 16 kg generator v1",
  materials: [
    { name: "Charcoal cast iron", baseColorFactor: [0.055, 0.061, 0.063, 1], metallicFactor: 0.48, roughnessFactor: 0.69 },
    { name: "Orange handle collars", baseColorFactor: [1, 0.23, 0.018, 1], metallicFactor: 0.16, roughnessFactor: 0.48 },
    { name: "Inset weight badge", baseColorFactor: [0.037, 0.041, 0.043, 1], metallicFactor: 0.4, roughnessFactor: 0.75 },
    { name: "Raised 16 KG marking", baseColorFactor: [0.43, 0.45, 0.44, 1], metallicFactor: 0.65, roughnessFactor: 0.48 },
  ],
});

// Copy only referenced vertices: collar bounds remain local after material merging.
function addBufferGeometry(geometry, material, indices = Array.from(geometry.index.array)) {
  const positions = geometry.getAttribute("position");
  const sourceNormals = geometry.getAttribute("normal");
  const vertices = [], normals = [], remappedIndices = [], vertexMap = new Map();
  for (const index of indices) {
    if (!vertexMap.has(index)) {
      vertexMap.set(index, vertices.length / 3);
      vertices.push(positions.getX(index), positions.getY(index), positions.getZ(index));
      normals.push(sourceNormals.getX(index), sourceNormals.getY(index), sourceNormals.getZ(index));
    }
    remappedIndices.push(vertexMap.get(index));
  }
  model.addGeometry({ vertices, normals, indices: remappedIndices, material });
}

// Closed lathed body: a broad planar sole and a rounded, slightly flattened bell.
const profile = [new Vector2(0, 0)];
const bottomAngle = Math.asin(-0.080 / 0.093);
for (let step = 0; step <= 32; step += 1) {
  const angle = bottomAngle + step / 32 * (Math.PI / 2 - bottomAngle);
  profile.push(new Vector2(0.09 * Math.cos(angle), step === 0 ? 0 : 0.080 + 0.093 * Math.sin(angle)));
}
profile[profile.length - 1].x = 0;
const body = new LatheGeometry(profile, 64);
body.scale(1, 1, 0.989);
addBufferGeometry(body, 0);

const path = new CurvePath();
const point = ([x, y]) => new Vector3(x, y, 0);
const spans = [
  [[-0.058, 0.128], [-0.078, 0.150], [-0.088, 0.181], [-0.088, 0.206]],
  [[-0.088, 0.206], [-0.088, 0.240], [-0.076, 0.255], [-0.049, 0.259]],
  [[-0.049, 0.259], [-0.018, 0.263], [0.018, 0.263], [0.049, 0.259]],
  [[0.049, 0.259], [0.076, 0.255], [0.088, 0.240], [0.088, 0.206]],
  [[0.088, 0.206], [0.088, 0.181], [0.078, 0.150], [0.058, 0.128]],
];
for (const span of spans) path.add(new CubicBezierCurve3(...span.map(point)));

// The tube ends terminate inside the body; the grip is genuinely open, not a decal.
const longitudinalSegments = 96;
const radialSegments = 16;
const handle = new TubeGeometry(path, longitudinalSegments, 0.0185, radialSegments, false);
const handleIndices = [[], []];
for (let segment = 0; segment < longitudinalSegments; segment += 1) {
  const collar = (segment >= 4 && segment < 7) || (segment >= 89 && segment < 92);
  const first = segment * radialSegments * 6;
  handleIndices[collar ? 1 : 0].push(...handle.index.array.slice(first, first + radialSegments * 6));
}
addBufferGeometry(handle, 0, handleIndices[0]);
addBufferGeometry(handle, 1, handleIndices[1]);

// A small cast badge and low-poly raised lettering identify the single 16 kg bell.
const badge = new CylinderGeometry(0.028, 0.028, 0.003, 48);
badge.rotateX(Math.PI / 2);
badge.translate(0, 0.08, -0.0875);
addBufferGeometry(badge, 2);
const glyphs = {
  "1": [[[0, 0.8], [0.5, 1], [0.5, 0]], [[0.1, 0], [0.9, 0]]],
  "6": [[[0.9, 0.9], [0.65, 1], [0.2, 0.8], [0.1, 0.2], [0.3, 0], [0.8, 0], [1, 0.2], [0.9, 0.5], [0.2, 0.5]]],
  K: [[[0, 0], [0, 1]], [[1, 1], [0, 0.5], [1, 0]]],
  G: [[[1, 0.85], [0.75, 1], [0.2, 1], [0, 0.75], [0, 0.25], [0.2, 0], [1, 0], [1, 0.45], [0.6, 0.45]]],
};
for (const [character, offset] of [["1", -0.021], ["6", -0.012], ["K", 0.002], ["G", 0.013]]) {
  for (const stroke of glyphs[character]) {
    for (let index = 1; index < stroke.length; index += 1) {
      const [ax, ay] = stroke[index - 1], [bx, by] = stroke[index];
      // Seen from -Z, screen-right is world -X: mirror glyph coordinates, not faces.
      const dx = -(bx - ax) * 0.007, dy = (by - ay) * 0.012;
      model.addBox({
        center: [-offset - (ax + bx) * 0.0035, 0.074 + (ay + by) * 0.006, -0.0894],
        size: [Math.hypot(dx, dy) + 0.0007, 0.0011, 0.0008],
        rotation: [0, 0, Math.atan2(dy, dx)], material: 3,
      });
    }
  }
}

// Canonical catalogue envelope in metres, floor-centred, weight marking at -Z.
const { min, max } = model.getMetrics();
const target = [0.21, 0.28, 0.18];
const scale = target.map((value, axis) => value / (max[axis] - min[axis]));
for (const group of model.groups) {
  for (let index = 0; index < group.vertices.length; index += 3) {
    for (let axis = 0; axis < 3; axis += 1) {
      const center = axis === 1 ? min[axis] : (min[axis] + max[axis]) / 2;
      group.vertices[index + axis] = (group.vertices[index + axis] - center) * scale[axis];
    }
    const normal = new Vector3(...group.normals.slice(index, index + 3)).divide(new Vector3(...scale)).normalize();
    group.normals.splice(index, 3, normal.x, normal.y, normal.z);
  }
}

await writeProceduralGlb(model, OUTPUT);
