import { readFile } from "node:fs/promises";

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const BINARY_CHUNK = 0x004e4942;

function parseGlb(file, path) {
  if (file.readUInt32LE(0) !== GLB_MAGIC || file.readUInt32LE(4) !== 2) {
    throw new Error(`${path} is not a glTF 2 GLB.`);
  }
  const jsonLength = file.readUInt32LE(12);
  if (file.readUInt32LE(16) !== JSON_CHUNK) throw new Error(`${path} has no GLB JSON chunk.`);
  const gltf = JSON.parse(file.subarray(20, 20 + jsonLength).toString());
  const binaryHeader = 20 + jsonLength;
  if (file.readUInt32LE(binaryHeader + 4) !== BINARY_CHUNK) throw new Error(`${path} has no GLB binary chunk.`);
  const binaryLength = file.readUInt32LE(binaryHeader);
  return { gltf, binary: file.subarray(binaryHeader + 8, binaryHeader + 8 + binaryLength) };
}

function accessorReader(componentType) {
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
  const reader = accessorReader(accessor.componentType);
  const stride = bufferView.byteStride ?? reader.bytes * components;
  const start = (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const view = new DataView(binary.buffer, binary.byteOffset, binary.byteLength);
  const values = [];
  for (let item = 0; item < accessor.count; item += 1) {
    for (let component = 0; component < components; component += 1) {
      values.push(reader.read(view, start + item * stride + component * reader.bytes));
    }
  }
  return values;
}

function assertFlatIdentityScene(gltf, path) {
  const roots = gltf.scenes[gltf.scene ?? 0]?.nodes ?? [];
  for (const nodeIndex of roots) {
    const node = gltf.nodes[nodeIndex];
    if (node.matrix || node.translation || node.rotation || node.scale || node.children?.length) {
      throw new Error(`${path} must have a flat identity scene before composition.`);
    }
  }
  return roots;
}

export async function addGlbToComposition(model, path, {
  center = [0, 0, 0],
  rotation = [0, 0, 0],
  materialMap,
} = {}) {
  const { gltf, binary } = parseGlb(await readFile(path), path);
  const roots = assertFlatIdentityScene(gltf, path);
  if (!materialMap || materialMap.length !== gltf.materials.length) {
    throw new Error(`${path} requires one destination material for every source material.`);
  }
  for (const nodeIndex of roots) {
    const node = gltf.nodes[nodeIndex];
    if (node.mesh === undefined) continue;
    for (const primitive of gltf.meshes[node.mesh].primitives) {
      if ((primitive.mode ?? 4) !== 4 || primitive.indices === undefined || primitive.attributes.NORMAL === undefined) {
        throw new Error(`${path} composition inputs must use indexed triangle primitives with normals.`);
      }
      model.addGeometry({
        vertices: readAccessor(gltf, binary, primitive.attributes.POSITION),
        normals: readAccessor(gltf, binary, primitive.attributes.NORMAL),
        indices: readAccessor(gltf, binary, primitive.indices),
        material: materialMap[primitive.material],
        center,
        rotation,
      });
    }
  }
}
