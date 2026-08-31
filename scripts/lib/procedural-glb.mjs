import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const COMPONENT_FLOAT = 5126;
const COMPONENT_UNSIGNED_SHORT = 5123;
const COMPONENT_UNSIGNED_INT = 5125;
const TARGET_ARRAY_BUFFER = 34962;
const TARGET_ELEMENT_ARRAY_BUFFER = 34963;

function rotate([x, y, z], [rx = 0, ry = 0, rz = 0]) {
  const cosX = Math.cos(rx), sinX = Math.sin(rx);
  const cosY = Math.cos(ry), sinY = Math.sin(ry);
  const cosZ = Math.cos(rz), sinZ = Math.sin(rz);
  const afterX = [x, y * cosX - z * sinX, y * sinX + z * cosX];
  const afterY = [afterX[0] * cosY + afterX[2] * sinY, afterX[1], -afterX[0] * sinY + afterX[2] * cosY];
  return [afterY[0] * cosZ - afterY[1] * sinZ, afterY[0] * sinZ + afterY[1] * cosZ, afterY[2]];
}

function normalize([x, y, z]) {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}

function pad4(value) {
  return (value + 3) & ~3;
}

export class ProceduralGlb {
  constructor({ generator, materials }) {
    this.generator = generator;
    this.materials = materials;
    this.groups = materials.map(() => ({ vertices: [], normals: [], indices: [], parts: 0 }));
  }

  addGeometry({ vertices, normals, indices, material = 0, center = [0, 0, 0], rotation = [0, 0, 0] }) {
    const group = this.groups[material];
    if (!group) throw new Error(`Unknown material index: ${material}`);
    const base = group.vertices.length / 3;
    for (let index = 0; index < vertices.length; index += 3) {
      const point = rotate([vertices[index], vertices[index + 1], vertices[index + 2]], rotation);
      group.vertices.push(point[0] + center[0], point[1] + center[1], point[2] + center[2]);
      group.normals.push(...normalize(rotate([normals[index], normals[index + 1], normals[index + 2]], rotation)));
    }
    group.indices.push(...indices.map((index) => index + base));
    group.parts += 1;
  }

  addBox({ center, size, material = 0, rotation = [0, 0, 0] }) {
    const [hx, hy, hz] = size.map((value) => value / 2);
    const corners = [
      [-hx, -hy, -hz], [hx, -hy, -hz], [hx, hy, -hz], [-hx, hy, -hz],
      [-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz],
    ];
    const faceSpecs = [
      [[0, 3, 2, 1], [0, 0, -1]], [[4, 5, 6, 7], [0, 0, 1]],
      [[0, 4, 7, 3], [-1, 0, 0]], [[1, 2, 6, 5], [1, 0, 0]],
      [[0, 1, 5, 4], [0, -1, 0]], [[3, 7, 6, 2], [0, 1, 0]],
    ];
    const vertices = [], normals = [], indices = [];
    for (const [face, normal] of faceSpecs) {
      const start = vertices.length / 3;
      for (const corner of face) { vertices.push(...corners[corner]); normals.push(...normal); }
      indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
    }
    this.addGeometry({ vertices, normals, indices, material, center, rotation });
  }

  addChamferedBox({ center, size, bevel, material = 0, rotation = [0, 0, 0] }) {
    const [hx, hy, hz] = size.map((value) => value / 2);
    const ring = [
      [-hx + bevel, -hz], [hx - bevel, -hz], [hx, -hz + bevel], [hx, hz - bevel],
      [hx - bevel, hz], [-hx + bevel, hz], [-hx, hz - bevel], [-hx, -hz + bevel],
    ];
    const vertices = [], normals = [], indices = [];
    const addCap = (y, normalY, reverse) => {
      const centerIndex = vertices.length / 3;
      vertices.push(0, y, 0); normals.push(0, normalY, 0);
      const ringStart = vertices.length / 3;
      for (const [x, z] of ring) { vertices.push(x, y, z); normals.push(0, normalY, 0); }
      for (let index = 0; index < ring.length; index += 1) {
        const next = (index + 1) % ring.length;
        indices.push(centerIndex, ringStart + (reverse ? next : index), ringStart + (reverse ? index : next));
      }
    };
    addCap(hy, 1, true);
    addCap(-hy, -1, false);
    for (let index = 0; index < ring.length; index += 1) {
      const next = (index + 1) % ring.length;
      const [x1, z1] = ring[index], [x2, z2] = ring[next];
      const normal = normalize([z2 - z1, 0, -(x2 - x1)]);
      const start = vertices.length / 3;
      vertices.push(x1, -hy, z1, x2, -hy, z2, x2, hy, z2, x1, hy, z1);
      for (let vertex = 0; vertex < 4; vertex += 1) normals.push(...normal);
      indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
    }
    this.addGeometry({ vertices, normals, indices, material, center, rotation });
  }

  addCylinder({ center, length, radius, axis = "x", material = 0, segments = 20, rotation = [0, 0, 0] }) {
    const vertices = [], normals = [], indices = [];
    const orient = ([along, u, v]) => axis === "x" ? [along, u, v] : axis === "y" ? [u, along, v] : [u, v, along];
    const sideStart = vertices.length / 3;
    for (const along of [-length / 2, length / 2]) {
      for (let segment = 0; segment < segments; segment += 1) {
        const angle = segment / segments * Math.PI * 2;
        vertices.push(...orient([along, Math.cos(angle) * radius, Math.sin(angle) * radius]));
        normals.push(...orient([0, Math.cos(angle), Math.sin(angle)]));
      }
    }
    for (let segment = 0; segment < segments; segment += 1) {
      const next = (segment + 1) % segments;
      indices.push(sideStart + segment, sideStart + segments + segment, sideStart + segments + next);
      indices.push(sideStart + segment, sideStart + segments + next, sideStart + next);
    }
    for (const end of [-1, 1]) {
      const normal = orient([end, 0, 0]);
      const capCenter = vertices.length / 3;
      vertices.push(...orient([end * length / 2, 0, 0])); normals.push(...normal);
      const capRing = vertices.length / 3;
      for (let segment = 0; segment < segments; segment += 1) {
        const angle = segment / segments * Math.PI * 2;
        vertices.push(...orient([end * length / 2, Math.cos(angle) * radius, Math.sin(angle) * radius]));
        normals.push(...normal);
      }
      for (let segment = 0; segment < segments; segment += 1) {
        const next = (segment + 1) % segments;
        indices.push(capCenter, capRing + (end < 0 ? next : segment), capRing + (end < 0 ? segment : next));
      }
    }
    this.addGeometry({ vertices, normals, indices, material, center, rotation });
  }

  // Offline repair for authored geometry whose outward normals are already correct.
  // Explicit opt-in keeps unrelated published assets byte-identical until reviewed.
  orientFacesToNormals() {
    let corrected = 0;
    for (const { vertices, normals, indices } of this.groups) {
      for (let index = 0; index < indices.length; index += 3) {
        const [a, b, c] = indices.slice(index, index + 3).map((vertex) => vertex * 3);
        const ab = [0, 1, 2].map((axis) => vertices[b + axis] - vertices[a + axis]);
        const ac = [0, 1, 2].map((axis) => vertices[c + axis] - vertices[a + axis]);
        const cross = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]];
        const dot = cross.reduce((sum, value, axis) => sum + value * (normals[a + axis] + normals[b + axis] + normals[c + axis]), 0);
        if (dot < 0) {
          [indices[index + 1], indices[index + 2]] = [indices[index + 2], indices[index + 1]];
          corrected += 1;
        }
      }
    }
    return corrected;
  }

  getMetrics() {
    const populated = this.groups.filter((group) => group.indices.length > 0);
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    let triangles = 0, vertices = 0, parts = 0;
    for (const group of populated) {
      triangles += group.indices.length / 3;
      vertices += group.vertices.length / 3;
      parts += group.parts;
      for (let index = 0; index < group.vertices.length; index += 3) {
        for (let axis = 0; axis < 3; axis += 1) {
          min[axis] = Math.min(min[axis], group.vertices[index + axis]);
          max[axis] = Math.max(max[axis], group.vertices[index + axis]);
        }
      }
    }
    return { nodes: populated.length, materials: populated.length, triangles, vertices, parts, min, max };
  }

  async write(path) {
    const populated = this.groups.map((group, material) => ({ ...group, material })).filter((group) => group.indices.length > 0);
    const chunks = [], bufferViews = [], accessors = [], meshes = [], nodes = [];
    let byteOffset = 0;
    const append = (typedArray, target) => {
      const padding = pad4(byteOffset) - byteOffset;
      if (padding > 0) {
        chunks.push(Buffer.alloc(padding));
        byteOffset += padding;
      }
      const buffer = Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
      chunks.push(buffer);
      const view = bufferViews.push({ buffer: 0, byteOffset, byteLength: buffer.length, target }) - 1;
      byteOffset += buffer.length;
      return view;
    };
    for (const group of populated) {
      const positions = new Float32Array(group.vertices), normals = new Float32Array(group.normals);
      const IndexArray = positions.length / 3 <= 65_535 ? Uint16Array : Uint32Array;
      const indices = new IndexArray(group.indices);
      const positionView = append(positions, TARGET_ARRAY_BUFFER);
      const normalView = append(normals, TARGET_ARRAY_BUFFER);
      const indexView = append(indices, TARGET_ELEMENT_ARRAY_BUFFER);
      const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
      for (let index = 0; index < positions.length; index += 3) for (let axis = 0; axis < 3; axis += 1) {
        min[axis] = Math.min(min[axis], positions[index + axis]);
        max[axis] = Math.max(max[axis], positions[index + axis]);
      }
      const positionAccessor = accessors.push({ bufferView: positionView, componentType: COMPONENT_FLOAT, count: positions.length / 3, type: "VEC3", min, max }) - 1;
      const normalAccessor = accessors.push({ bufferView: normalView, componentType: COMPONENT_FLOAT, count: normals.length / 3, type: "VEC3" }) - 1;
      const indexAccessor = accessors.push({
        bufferView: indexView,
        componentType: indices instanceof Uint16Array ? COMPONENT_UNSIGNED_SHORT : COMPONENT_UNSIGNED_INT,
        count: indices.length,
        type: "SCALAR",
      }) - 1;
      const mesh = meshes.push({ name: this.materials[group.material].name, primitives: [{ attributes: { POSITION: positionAccessor, NORMAL: normalAccessor }, indices: indexAccessor, material: group.material }] }) - 1;
      nodes.push({ name: `${this.materials[group.material].name} parts`, mesh });
    }
    const binary = Buffer.concat(chunks);
    const binaryPadded = Buffer.concat([binary, Buffer.alloc(pad4(binary.length) - binary.length)]);
    const gltf = {
      asset: { version: "2.0", generator: this.generator }, scene: 0,
      scenes: [{ nodes: nodes.map((_, index) => index) }], nodes, meshes,
      materials: this.materials.map(({ name, doubleSided = false, ...pbrMetallicRoughness }) => ({ name, doubleSided, pbrMetallicRoughness })),
      buffers: [{ byteLength: binaryPadded.length }], bufferViews, accessors,
    };
    const json = Buffer.from(JSON.stringify(gltf));
    const jsonPadded = Buffer.concat([json, Buffer.alloc(pad4(json.length) - json.length, 0x20)]);
    const header = Buffer.alloc(12), jsonHeader = Buffer.alloc(8), binaryHeader = Buffer.alloc(8);
    const totalLength = header.length + jsonHeader.length + jsonPadded.length + binaryHeader.length + binaryPadded.length;
    header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(totalLength, 8);
    jsonHeader.writeUInt32LE(jsonPadded.length, 0); jsonHeader.writeUInt32LE(0x4e4f534a, 4);
    binaryHeader.writeUInt32LE(binaryPadded.length, 0); binaryHeader.writeUInt32LE(0x004e4942, 4);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, Buffer.concat([header, jsonHeader, jsonPadded, binaryHeader, binaryPadded]));
    return this.getMetrics();
  }
}

export async function writeProceduralGlb(model, output) {
  const metrics = await model.write(output);
  const dimensions = metrics.max.map((value, axis) => value - metrics.min[axis]);
  console.log(`Generated ${output}`);
  console.log(JSON.stringify({ ...metrics, dimensions }, null, 2));
  return { ...metrics, dimensions };
}
