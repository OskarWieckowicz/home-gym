import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Box3, Group, Mesh, Raycaster, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { beforeAll, describe, expect, it } from "vitest";

const asset = "public/assets/forge-kettlebell-16kg.glb";
let scene: Group;
let source: Buffer;

beforeAll(async () => {
  source = await readFile(asset);
  ({ scene } = await new GLTFLoader().parseAsync(new Uint8Array(source).buffer, ""));
  scene.updateMatrixWorld(true);
});

function intersections(x: number, y: number) {
  return new Raycaster(new Vector3(x, y, -0.5), new Vector3(0, 0, 1)).intersectObject(scene, true);
}

describe("Forge 16 kg kettlebell asset", () => {
  it("loads a floor-centred 21 × 18 × 28 cm bell with four merged materials", () => {
    const bounds = new Box3().setFromObject(scene);
    const size = bounds.getSize(new Vector3());
    expect(size.x).toBeCloseTo(0.21, 6);
    expect(size.z).toBeCloseTo(0.18, 6);
    expect(size.y).toBeCloseTo(0.28, 6);
    expect(bounds.min.y).toBeCloseTo(0, 7);
    expect(bounds.getCenter(new Vector3()).x).toBeCloseTo(0, 7);
    expect(bounds.getCenter(new Vector3()).z).toBeCloseTo(0, 7);
    expect(scene.children).toHaveLength(4);
    expect(source.byteLength).toBeLessThan(250_000);
  });

  it("has a genuinely open grip above a solid bell and below a solid arch", () => {
    for (const x of [-0.035, 0, 0.035]) {
      expect(intersections(x, 0.213)).toHaveLength(0);
      expect(intersections(x, 0.08).length).toBeGreaterThan(0);
      expect(intersections(x, 0.266).length).toBeGreaterThan(0);
    }
    for (const x of [-0.086, 0.086]) expect(intersections(x, 0.212).length).toBeGreaterThan(0);
    const floorHits = new Raycaster(new Vector3(0.02, -0.1, 0.02), new Vector3(0, 1, 0)).intersectObject(scene, true);
    expect(floorHits[0]?.point.y).toBeCloseTo(0, 7);
  });

  it("keeps orange collars on both handle roots and the marking toward -Z", () => {
    const collars = scene.getObjectByName("Orange_handle_collars_parts") as Mesh;
    const points = collars.geometry.getAttribute("position");
    let left = 0, right = 0;
    for (let index = 0; index < points.count; index += 1) {
      expect(Math.abs(points.getX(index))).toBeGreaterThan(0.04);
      expect(points.getY(index)).toBeGreaterThan(0.13);
      expect(points.getY(index)).toBeLessThan(0.20);
      if (points.getX(index) < 0) left += 1;
      else right += 1;
    }
    expect(left).toBeGreaterThan(0);
    expect(right).toBe(left);
    const marking = scene.getObjectByName("Raised_16_KG_marking_parts")!;
    expect(new Box3().setFromObject(marking).max.z).toBeLessThan(-0.085);
  });

  it("embeds both handle roots into the bell without a daylight gap", () => {
    for (const x of [-0.074, 0.074]) {
      for (let step = 0; step <= 35; step += 1) {
        expect(intersections(x, 0.13 + step * 0.002).length).toBeGreaterThan(0);
      }
    }
  });

  it("puts the 1 at front-view left and G at front-view right, not mirrored", () => {
    const marking = scene.getObjectByName("Raised_16_KG_marking_parts") as Mesh;
    const positions = marking.geometry.getAttribute("position");
    const xs = Array.from({ length: positions.count }, (_, index) => positions.getX(index));
    // Camera at -Z sees world +X on its left. The 1 uses 3 box strokes, G uses 8.
    expect(xs.filter((x) => x > 0.013).length).toBe(3 * 24);
    expect(xs.filter((x) => x < -0.012).length).toBe(8 * 24);
  });

  it("uses finite unit normals, valid indices, outward faces and a modest triangle budget", () => {
    let triangles = 0;
    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const positions = object.geometry.getAttribute("position");
      const normals = object.geometry.getAttribute("normal");
      const indices = object.geometry.index!;
      triangles += indices.count / 3;
      for (let index = 0; index < positions.count; index += 1) {
        const normal = new Vector3().fromBufferAttribute(normals, index);
        expect(normal.length()).toBeCloseTo(1, 5);
        expect(Number.isFinite(positions.getX(index) + positions.getY(index) + positions.getZ(index))).toBe(true);
      }
      for (let index = 0; index < indices.count; index += 3) {
        const ids = [indices.getX(index), indices.getX(index + 1), indices.getX(index + 2)];
        expect(ids.every((id) => id >= 0 && id < positions.count)).toBe(true);
        const [a, b, c] = ids.map((id) => new Vector3().fromBufferAttribute(positions, id));
        const face = b.sub(a).cross(c.sub(a));
        if (face.lengthSq() < 1e-18) continue;
        const smooth = ids.reduce((sum, id) => sum.add(new Vector3().fromBufferAttribute(normals, id)), new Vector3());
        expect(face.dot(smooth)).toBeGreaterThan(0);
      }
    });
    expect(triangles).toBeGreaterThan(4_000);
    expect(triangles).toBeLessThan(10_000);
  });

  it("regenerates byte-identically without network or external assets", async () => {
    const directory = await mkdtemp(join(tmpdir(), "forge-kettlebell-"));
    try {
      const output = join(directory, "bell.glb");
      execFileSync(process.execPath, ["scripts/generate-forge-kettlebell-glb.mjs", output], { stdio: "pipe" });
      expect(await readFile(output)).toEqual(source);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
