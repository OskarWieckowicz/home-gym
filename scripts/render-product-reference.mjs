import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import sharp from "sharp";
import { Box3, Matrix3, OrthographicCamera, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { rasterizeReference } from "./lib/rasterize-reference.mjs";

// Offline structural reference, not the finished catalog photo. No browser or GPU required.
const [input, output, view = "front"] = process.argv.slice(2);
if (!input || !output || !["front", "rear"].includes(view)) {
  throw new Error("Usage: node scripts/render-product-reference.mjs input.glb output.png [front|rear]");
}
const bytes = await readFile(input);
const { scene: model } = await new GLTFLoader().parseAsync(new Uint8Array(bytes).buffer, "");
const bounds = new Box3().setFromObject(model);
const center = bounds.getCenter(new Vector3());
const radius = bounds.getSize(new Vector3()).length();
const camera = new OrthographicCamera(-1, 1, 1, -1, 0.01, radius * 10);
camera.position.copy(center).add(new Vector3(0.9, 0.55, view === "rear" ? 1.6 : -1.6).normalize().multiplyScalar(radius * 3));
camera.lookAt(center);
camera.updateMatrixWorld();
const corners = [];
for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) {
  for (const z of [bounds.min.z, bounds.max.z]) corners.push(new Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse));
}
const projected = new Box3().setFromPoints(corners);
const half = Math.max(projected.max.x - projected.min.x, projected.max.y - projected.min.y) * 0.57;
camera.left = -half;
camera.right = half;
camera.top = half;
camera.bottom = -half;
camera.updateProjectionMatrix();

const size = 1400;
const key = new Vector3(-3, 5, -4).normalize();
const fill = new Vector3(4, 2, 1).normalize();
const triangles = [];
model.traverse((object) => {
  if (!object.isMesh) return;
  const { geometry, material } = object;
  if (Array.isArray(material)) throw new Error("Reference renderer expects one material per GLB primitive.");
  const positions = geometry.getAttribute("position");
  const normals = geometry.getAttribute("normal");
  const normalMatrix = new Matrix3().getNormalMatrix(object.matrixWorld);
  const count = geometry.index?.count ?? positions.count;
  for (let index = 0; index < count; index += 3) {
    const normal = new Vector3();
    const points = [0, 1, 2].map((offset) => {
      const vertex = geometry.index ? geometry.index.getX(index + offset) : index + offset;
      normal.add(new Vector3().fromBufferAttribute(normals, vertex).applyNormalMatrix(normalMatrix));
      const point = new Vector3().fromBufferAttribute(positions, vertex).applyMatrix4(object.matrixWorld).project(camera);
      return { x: (point.x + 1) * size / 2, y: (1 - point.y) * size / 2, z: point.z };
    });
    normal.normalize();
    const light = 0.5 + Math.max(0, normal.dot(key)) * 0.9 + Math.max(0, normal.dot(fill)) * 0.3;
    const color = material.color.clone().multiplyScalar(light).convertLinearToSRGB();
    triangles.push({ points, color: [color.r, color.g, color.b].map((value) => Math.round(Math.min(1, value) * 255)) });
  }
});
const pixels = rasterizeReference(triangles, size);
await mkdir(dirname(output), { recursive: true });
await writeFile(output, await sharp(pixels, { raw: { width: size, height: size, channels: 3 } }).png().toBuffer());
console.log(`Rendered structural reference ${output} from ${input}`);
