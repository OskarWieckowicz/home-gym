import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

async function inspect(path) {
  const file = await readFile(path);
  if (file.readUInt32LE(0) !== 0x46546c67 || file.readUInt32LE(4) !== 2) throw new Error(`${path} is not a glTF 2 GLB.`);
  const jsonLength = file.readUInt32LE(12);
  const gltf = JSON.parse(file.subarray(20, 20 + jsonLength).toString());
  const primitives = gltf.meshes.flatMap((mesh) => mesh.primitives);
  const positions = primitives.map((primitive) => gltf.accessors[primitive.attributes.POSITION]);
  const indices = primitives.map((primitive) => gltf.accessors[primitive.indices]);
  const min = [0, 1, 2].map((axis) => Math.min(...positions.map((accessor) => accessor.min[axis])));
  const max = [0, 1, 2].map((axis) => Math.max(...positions.map((accessor) => accessor.max[axis])));
  return {
    path,
    sha256: createHash("sha256").update(file).digest("hex"),
    bytes: file.length,
    generator: gltf.asset.generator,
    bounds: { min, max, dimensions: max.map((value, axis) => value - min[axis]) },
    triangles: indices.reduce((sum, accessor) => sum + accessor.count / 3, 0),
    nodes: gltf.nodes.length,
    meshes: gltf.meshes.length,
    primitives: primitives.length,
    materials: gltf.materials.length,
    hasNormals: primitives.every((primitive) => primitive.attributes.NORMAL !== undefined),
  };
}

const paths = process.argv.slice(2);
if (paths.length === 0) throw new Error("Usage: node scripts/inspect-glb.mjs <asset.glb> [...]");
console.log(JSON.stringify(await Promise.all(paths.map(inspect)), null, 2));
