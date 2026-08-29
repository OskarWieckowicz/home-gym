import { mkdir, writeFile } from "node:fs/promises";

const meshes = [];
const materials = [
  { name: "Graphite powder coat", baseColorFactor: [0.025, 0.032, 0.042, 1], metallicFactor: 0.78, roughnessFactor: 0.25 },
  { name: "Safety orange powder coat", baseColorFactor: [0.95, 0.16, 0.018, 1], metallicFactor: 0.48, roughnessFactor: 0.28 },
  { name: "Black UHMW and rubber", baseColorFactor: [0.006, 0.007, 0.009, 1], metallicFactor: 0.02, roughnessFactor: 0.78 },
  { name: "Zinc hardware", baseColorFactor: [0.52, 0.57, 0.62, 1], metallicFactor: 0.93, roughnessFactor: 0.2 },
  { name: "Brushed steel", baseColorFactor: [0.23, 0.27, 0.3, 1], metallicFactor: 0.9, roughnessFactor: 0.24 },
];

function box(name, center, size, material = 0) {
  const [cx, cy, cz] = center;
  const [sx, sy, sz] = size.map((value) => value / 2);
  const positions = [
    [-sx, -sy, -sz], [sx, -sy, -sz], [sx, sy, -sz], [-sx, sy, -sz],
    [-sx, -sy, sz], [sx, -sy, sz], [sx, sy, sz], [-sx, sy, sz],
  ].map(([x, y, z]) => [x + cx, y + cy, z + cz]);
  const normals = [[0, 0, -1], [0, 0, 1], [-1, 0, 0], [1, 0, 0], [0, -1, 0], [0, 1, 0]];
  const faces = [
    [0, 1, 2, 3, 0], [4, 7, 6, 5, 1], [0, 4, 5, 1, 2],
    [1, 5, 6, 2, 3], [2, 6, 7, 3, 4], [4, 0, 3, 7, 5],
  ];
  const vertices = [], vertexNormals = [], indices = [];
  for (const [a, b, c, d, normalIndex] of faces) {
    const base = vertices.length / 3;
    for (const index of [a, b, c, d]) { vertices.push(...positions[index]); vertexNormals.push(...normals[normalIndex]); }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  meshes.push({ name, vertices, normals: vertexNormals, indices, material });
}

function cylinder(name, center, length, radius, axis = "x", material = 0, segments = 20) {
  const [cx, cy, cz] = center;
  const vertices = [], normals = [], indices = [];
  const point = (along, a) => {
    const u = Math.cos(a) * radius, v = Math.sin(a) * radius;
    if (axis === "x") return [cx + along, cy + u, cz + v];
    if (axis === "y") return [cx + u, cy + along, cz + v];
    return [cx + u, cy + v, cz + along];
  };
  const normal = (a) => {
    const u = Math.cos(a), v = Math.sin(a);
    if (axis === "x") return [0, u, v];
    if (axis === "y") return [u, 0, v];
    return [u, v, 0];
  };
  for (let end = -1; end <= 1; end += 2) for (let i = 0; i < segments; i += 1) {
    const a = (i / segments) * Math.PI * 2;
    vertices.push(...point(end * length / 2, a));
    normals.push(...normal(a));
  }
  for (let i = 0; i < segments; i += 1) {
    const next = (i + 1) % segments;
    const a = i, b = next, c = segments + next, d = segments + i;
    indices.push(a, d, c, a, c, b);
  }
  for (const [end, direction] of [[-1, -1], [1, 1]]) {
    const centerIndex = vertices.length / 3;
    vertices.push(...point(end * length / 2, 0).map((value, i) => value - normal(0)[i] * radius));
    normals.push(axis === "x" ? direction : 0, axis === "y" ? direction : 0, axis === "z" ? direction : 0);
    const ringStart = vertices.length / 3;
    for (let i = 0; i < segments; i += 1) {
      vertices.push(...point(end * length / 2, (i / segments) * Math.PI * 2));
      normals.push(axis === "x" ? direction : 0, axis === "y" ? direction : 0, axis === "z" ? direction : 0);
    }
    for (let i = 0; i < segments; i += 1) {
      const next = (i + 1) % segments;
      if (end < 0) indices.push(centerIndex, ringStart + next, ringStart + i);
      else indices.push(centerIndex, ringStart + i, ringStart + next);
    }
  }
  meshes.push({ name, vertices, normals, indices, material });
}

// Real-world scale in metres: 1.28 m wide x 1.45 m deep x 2.25 m tall.
const postX = 0.535, postZ = 0.48, postSize = 0.075;
for (const x of [-postX, postX]) for (const z of [-postZ, postZ]) {
  box(`upright-${x}-${z}`, [x, 1.125, z], [postSize, 2.25, postSize]);
  box(`upright-cap-${x}-${z}`, [x, 2.256, z], [0.067, 0.012, 0.067], 2);
}
for (const z of [-postZ, postZ]) {
  box(`base-crossbar-${z}`, [0, 0.075, z], [1.15, 0.1, postSize]);
  box(`top-crossbar-${z}`, [0, 2.17, z], [1.15, 0.1, postSize]);
}
for (const x of [-postX, postX]) {
  box(`base-rail-${x}`, [x, 0.075, 0], [postSize, 0.1, 1.18]);
  box(`front-foot-${x}`, [x, 0.035, -0.66], [0.25, 0.07, 0.42]);
  box(`rear-foot-${x}`, [x, 0.035, 0.66], [0.25, 0.07, 0.42]);
  box(`front-rubber-${x}`, [x, 0.012, -0.79], [0.23, 0.024, 0.14], 2);
  box(`rear-rubber-${x}`, [x, 0.012, 0.79], [0.23, 0.024, 0.14], 2);
}

// Knurled pull-up bar and reinforced upper brackets.
cylinder("pull-up-bar", [0, 2.215, -0.49], 1.18, 0.032, "x", 4, 28);
for (const x of [-postX, postX]) {
  box(`pullup-bracket-${x}`, [x, 2.175, -0.49], [0.12, 0.19, 0.11], 1);
  cylinder(`top-bolt-${x}`, [x, 2.17, -0.535], 0.105, 0.015, "z", 3, 16);
}

// Height-index holes represented as recessed black steel discs on the post faces.
for (const x of [-postX, postX]) for (const z of [-postZ, postZ]) {
  for (let row = 0; row < 23; row += 1) {
    const y = 0.38 + row * 0.073;
    cylinder(`height-hole-x-${x}-${z}-${row}`, [x + Math.sign(x) * 0.039, y, z], 0.006, 0.009, "x", 2, 12);
    cylinder(`height-hole-z-${x}-${z}-${row}`, [x, y, z + Math.sign(z) * 0.039], 0.006, 0.009, "z", 2, 12);
  }
}

// J-cups, protective liners and front lips.
for (const x of [-postX, postX]) {
  box(`j-cup-back-${x}`, [x, 1.47, -0.525], [0.13, 0.22, 0.12], 1);
  box(`j-cup-shelf-${x}`, [x, 1.405, -0.585], [0.14, 0.075, 0.24], 1);
  box(`j-cup-liner-${x}`, [x, 1.448, -0.59], [0.125, 0.012, 0.2], 2);
  box(`j-cup-lip-${x}`, [x, 1.48, -0.69], [0.14, 0.14, 0.045], 1);

  // Pin-and-pipe safety running through the cage.
  cylinder(`safety-pin-${x}`, [x, 1.08, 0], 1.13, 0.022, "z", 3, 20);
  cylinder(`safety-sleeve-${x}`, [x, 1.08, 0], 0.88, 0.031, "z", 1, 20);
  cylinder(`safety-handle-${x}`, [x, 1.08, -0.61], 0.22, 0.042, "z", 1, 20);
}

// Rear weight-plate storage pegs.
for (const y of [0.53, 0.9]) for (const x of [-postX, postX]) {
  cylinder(`plate-horn-${x}-${y}`, [x, y, postZ + 0.19], 0.38, 0.024, "z", 4, 20);
  cylinder(`plate-horn-stop-${x}-${y}`, [x, y, postZ + 0.04], 0.035, 0.045, "z", 3, 20);
}

// Visible structural hardware, floor anchors and a simple brand plate.
for (const x of [-postX, postX]) for (const z of [-postZ, postZ]) {
  for (const y of [0.1, 2.17]) cylinder(`joint-bolt-${x}-${z}-${y}`, [x + Math.sign(x) * 0.041, y, z], 0.018, 0.016, "x", 3, 16);
}
for (const x of [-postX - 0.08, -postX + 0.08, postX - 0.08, postX + 0.08]) for (const z of [-0.77, 0.77]) {
  cylinder(`anchor-${x}-${z}`, [x, 0.071, z], 0.012, 0.014, "y", 2, 14);
}
box("brand-plate", [0, 2.171, -0.522], [0.34, 0.07, 0.012], 1);
box("brand-stripe", [0, 2.171, -0.53], [0.2, 0.016, 0.006], 3);

const bufferParts = [];
const align4 = (value) => (value + 3) & ~3;
const append = (typed) => { const offset = bufferParts.reduce((sum, part) => sum + part.byteLength, 0); bufferParts.push(typed); return offset; };
const bufferViews = [], accessors = [], primitives = [], nodes = [];
for (const mesh of meshes) {
  const pos = new Float32Array(mesh.vertices), norm = new Float32Array(mesh.normals), ind = new Uint16Array(mesh.indices);
  const posOffset = append(pos), normOffset = append(norm), indOffset = append(ind);
  const posView = bufferViews.push({ buffer: 0, byteOffset: posOffset, byteLength: pos.byteLength, target: 34962 }) - 1;
  const normView = bufferViews.push({ buffer: 0, byteOffset: normOffset, byteLength: norm.byteLength, target: 34962 }) - 1;
  const indView = bufferViews.push({ buffer: 0, byteOffset: indOffset, byteLength: ind.byteLength, target: 34963 }) - 1;
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < mesh.vertices.length; i += 3) for (let axis = 0; axis < 3; axis += 1) { min[axis] = Math.min(min[axis], mesh.vertices[i + axis]); max[axis] = Math.max(max[axis], mesh.vertices[i + axis]); }
  const posAccessor = accessors.push({ bufferView: posView, componentType: 5126, count: pos.length / 3, type: "VEC3", min, max }) - 1;
  const normAccessor = accessors.push({ bufferView: normView, componentType: 5126, count: norm.length / 3, type: "VEC3" }) - 1;
  const indAccessor = accessors.push({ bufferView: indView, componentType: 5123, count: ind.length, type: "SCALAR" }) - 1;
  const meshIndex = primitives.push({ attributes: { POSITION: posAccessor, NORMAL: normAccessor }, indices: indAccessor, material: mesh.material, mode: 4 }) - 1;
  nodes.push({ name: mesh.name, mesh: meshIndex });
}
const raw = Buffer.concat(bufferParts.map((part) => Buffer.from(part.buffer, part.byteOffset, part.byteLength)));
const padded = Buffer.concat([raw, Buffer.alloc(align4(raw.length) - raw.length)]);
const gltf = {
  asset: { version: "2.0", generator: "Home Gym Creator squat rack generator" },
  scene: 0, scenes: [{ nodes: nodes.map((_, index) => index) }], nodes,
  meshes: primitives.map((primitive, index) => ({ name: meshes[index].name, primitives: [primitive] })),
  materials: materials.map(({ name, ...pbrMetallicRoughness }) => ({ name, pbrMetallicRoughness })),
  buffers: [{ byteLength: padded.length }], bufferViews, accessors,
};
const json = Buffer.from(JSON.stringify(gltf));
const jsonPadded = Buffer.concat([json, Buffer.alloc(align4(json.length) - json.length, 0x20)]);
const header = Buffer.alloc(12); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + jsonPadded.length + 8 + padded.length, 8);
const jsonHeader = Buffer.alloc(8); jsonHeader.writeUInt32LE(jsonPadded.length, 0); jsonHeader.writeUInt32LE(0x4e4f534a, 4);
const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(padded.length, 0); binHeader.writeUInt32LE(0x004e4942, 4);
await mkdir("public/assets", { recursive: true });
await writeFile("public/assets/squat-rack.glb", Buffer.concat([header, jsonHeader, jsonPadded, binHeader, padded]));
console.log(`Generated public/assets/squat-rack.glb (${meshes.length} parts, ${padded.length} bytes)`);
