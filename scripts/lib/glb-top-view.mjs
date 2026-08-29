import { readFile, writeFile } from "node:fs/promises";
import { dirname, basename } from "node:path";
import { mkdir } from "node:fs/promises";

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const BINARY_CHUNK = 0x004e4942;
const TRIANGLES_MODE = 4;

function parseGlb(file) {
  if (file.readUInt32LE(0) !== GLB_MAGIC || file.readUInt32LE(4) !== 2) throw new Error("Expected a glTF 2 GLB.");
  const jsonLength = file.readUInt32LE(12);
  if (file.readUInt32LE(16) !== JSON_CHUNK) throw new Error("GLB JSON chunk is missing.");
  const gltf = JSON.parse(file.subarray(20, 20 + jsonLength).toString());
  const binaryHeader = 20 + jsonLength;
  if (file.readUInt32LE(binaryHeader + 4) !== BINARY_CHUNK) throw new Error("GLB binary chunk is missing.");
  const binaryLength = file.readUInt32LE(binaryHeader);
  return { gltf, binary: file.subarray(binaryHeader + 8, binaryHeader + 8 + binaryLength) };
}

function componentReader(componentType) {
  if (componentType === 5123) return { bytes: 2, read: (view, offset) => view.getUint16(offset, true) };
  if (componentType === 5125) return { bytes: 4, read: (view, offset) => view.getUint32(offset, true) };
  if (componentType === 5126) return { bytes: 4, read: (view, offset) => view.getFloat32(offset, true) };
  throw new Error(`Unsupported GLB component type: ${componentType}`);
}

function readAccessor(gltf, binary, accessorIndex) {
  const accessor = gltf.accessors[accessorIndex];
  const bufferView = gltf.bufferViews[accessor.bufferView];
  const components = accessor.type === "VEC3" ? 3 : accessor.type === "SCALAR" ? 1 : 0;
  if (components === 0) throw new Error(`Unsupported accessor type: ${accessor.type}`);
  const reader = componentReader(accessor.componentType);
  const stride = bufferView.byteStride ?? reader.bytes * components;
  const start = (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const view = new DataView(binary.buffer, binary.byteOffset, binary.byteLength);
  return Array.from({ length: accessor.count }, (_, item) => {
    const values = Array.from({ length: components }, (_unused, component) => reader.read(view, start + item * stride + component * reader.bytes));
    return components === 1 ? values[0] : values;
  });
}

function identityMatrix() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function multiplyMatrices(left, right) {
  const result = Array(16).fill(0);
  for (let column = 0; column < 4; column += 1) for (let row = 0; row < 4; row += 1) {
    for (let index = 0; index < 4; index += 1) result[column * 4 + row] += left[index * 4 + row] * right[column * 4 + index];
  }
  return result;
}

function nodeMatrix(node) {
  if (node.matrix) return node.matrix;
  const [x, y, z, w] = node.rotation ?? [0, 0, 0, 1];
  const [sx, sy, sz] = node.scale ?? [1, 1, 1];
  const [tx, ty, tz] = node.translation ?? [0, 0, 0];
  return [
    (1 - 2 * y * y - 2 * z * z) * sx, (2 * x * y + 2 * z * w) * sx, (2 * x * z - 2 * y * w) * sx, 0,
    (2 * x * y - 2 * z * w) * sy, (1 - 2 * x * x - 2 * z * z) * sy, (2 * y * z + 2 * x * w) * sy, 0,
    (2 * x * z + 2 * y * w) * sz, (2 * y * z - 2 * x * w) * sz, (1 - 2 * x * x - 2 * y * y) * sz, 0,
    tx, ty, tz, 1,
  ];
}

function transformPoint(matrix, [x, y, z]) {
  return [
    matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
    matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
    matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14],
  ];
}

function faceNormal([a, b, c]) {
  const ab = b.map((value, axis) => value - a[axis]);
  const ac = c.map((value, axis) => value - a[axis]);
  const normal = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]];
  const length = Math.hypot(...normal) || 1;
  return normal.map((value) => value / length);
}

function materialStyle(material, normalY) {
  const [red, green, blue, alpha = 1] = material?.pbrMetallicRoughness?.baseColorFactor ?? [0.5, 0.5, 0.5, 1];
  const light = 0.68 + 0.32 * Math.sqrt(Math.max(0, normalY));
  const channel = (value) => Math.round(Math.min(1, value * light) * 255).toString(16).padStart(2, "0");
  return { fill: `#${channel(red)}${channel(green)}${channel(blue)}`, opacity: Math.round(alpha * 1000) / 1000 };
}

function format(value) {
  const rounded = Math.round(value * 10_000) / 10_000;
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function collectTriangles(gltf, binary) {
  const triangles = [];
  let order = 0;
  const visit = (nodeIndex, parentMatrix) => {
    const node = gltf.nodes[nodeIndex];
    const matrix = multiplyMatrices(parentMatrix, nodeMatrix(node));
    if (node.mesh !== undefined) {
      for (const primitive of gltf.meshes[node.mesh].primitives) {
        if ((primitive.mode ?? TRIANGLES_MODE) !== TRIANGLES_MODE) throw new Error("Top-view projection supports triangle primitives only.");
        const positions = readAccessor(gltf, binary, primitive.attributes.POSITION).map((point) => transformPoint(matrix, point));
        const indices = primitive.indices === undefined ? positions.map((_point, index) => index) : readAccessor(gltf, binary, primitive.indices);
        for (let index = 0; index < indices.length; index += 3) {
          const points = [positions[indices[index]], positions[indices[index + 1]], positions[indices[index + 2]]];
          const normal = faceNormal(points);
          const area = Math.abs((points[1][0] - points[0][0]) * (points[2][2] - points[0][2]) - (points[2][0] - points[0][0]) * (points[1][2] - points[0][2]));
          if (normal[1] <= 0.0001 || area <= 0.00000001) continue;
          triangles.push({ points, depth: points.reduce((sum, point) => sum + point[1], 0) / 3, order: order += 1, style: materialStyle(gltf.materials?.[primitive.material], normal[1]) });
        }
      }
    }
    for (const child of node.children ?? []) visit(child, matrix);
  };
  for (const root of gltf.scenes[gltf.scene ?? 0].nodes ?? []) visit(root, identityMatrix());
  return triangles.sort((left, right) => left.depth - right.depth || left.order - right.order);
}

function renderSvg(triangles, sourceName) {
  if (triangles.length === 0) throw new Error("GLB has no upward-facing geometry to project.");
  const allPoints = triangles.flatMap((triangle) => triangle.points);
  const minX = Math.min(...allPoints.map((point) => point[0])), maxX = Math.max(...allPoints.map((point) => point[0]));
  const minZ = Math.min(...allPoints.map((point) => point[2])), maxZ = Math.max(...allPoints.map((point) => point[2]));
  const groups = [];
  for (const triangle of triangles) {
    const key = `${triangle.style.fill}:${triangle.style.opacity}`;
    const path = `M${triangle.points.map((point) => `${format(point[0])} ${format(point[2])}`).join("L")}Z`;
    const previous = groups.at(-1);
    if (previous?.key === key) previous.paths.push(path);
    else groups.push({ key, style: triangle.style, paths: [path] });
  }
  const paths = groups.map((group) => `<path d="${group.paths.join("")}" fill="${group.style.fill}" fill-opacity="${group.style.opacity}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${format(minX)} ${format(minZ)} ${format(maxX - minX)} ${format(maxZ - minZ)}" preserveAspectRatio="xMidYMid meet" shape-rendering="geometricPrecision"><metadata>Home Gym Creator deterministic top view from ${sourceName}</metadata>${paths}</svg>\n`;
}

export async function generateGlbTopViewSvg(inputPath, outputPath) {
  const { gltf, binary } = parseGlb(await readFile(inputPath));
  const svg = renderSvg(collectTriangles(gltf, binary), basename(inputPath));
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, svg);
  return { bytes: Buffer.byteLength(svg), triangles: (svg.match(/M/g) ?? []).length };
}
