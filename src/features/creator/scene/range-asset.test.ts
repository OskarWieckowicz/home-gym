import { readFile } from "node:fs/promises";
import { Box3, Group, Mesh, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { beforeAll, describe, expect, it } from "vitest";
import { equipmentVisualRotation } from "./visual-orientation";

let scene: Group;

beforeAll(async () => {
  const buffer = await readFile("public/assets/range-adjustable-dumbbells.glb");
  ({ scene } = await new GLTFLoader().parseAsync(new Uint8Array(buffer).buffer, ""));
});

function vertices(name: string) {
  const mesh = scene.getObjectByName(name) as Mesh;
  expect(mesh?.isMesh).toBe(true);
  const positions = mesh.geometry.getAttribute("position");
  return Array.from({ length: positions.count }, (_, index) => new Vector3().fromBufferAttribute(positions, index));
}

describe("Range dumbbell geometry", () => {
  it("loads four separate weight packs around two clear grip spaces", () => {
    const points = vertices("Segmented_iron_weights_parts");
    expect(points.every((point) => Math.abs(point.x) >= 0.0149 && Math.abs(point.z) >= 0.0779)).toBe(true);
    for (const side of [-1, 1]) {
      for (const end of [-1, 1]) {
        const pack = points.filter((point) => Math.sign(point.x) === side && Math.sign(point.z) === end);
        expect(pack.length).toBeGreaterThan(0);
        const bounds = new Box3().setFromPoints(pack);
        const center = bounds.getCenter(new Vector3());
        expect(center.x).toBeCloseTo(side * 0.12, 6);
        expect(center.z).toBeCloseTo(end * 0.144, 6);
        expect(bounds.min.y).toBeCloseTo(0.41, 6);
        expect(bounds.max.y).toBeCloseTo(0.62, 6);
      }
    }
  });

  it.each([
    [0, 0, 1], [90, -1, 0], [180, 0, -1], [270, 1, 0],
  ] as const)("keeps the selector dials toward the domain front at %s°", (rotation, x, z) => {
    const points = vertices("Orange_front_selectors_parts");
    expect(points.every((point) => point.z < -0.21)).toBe(true);
    for (const side of [-1, 1]) {
      const dial = points.filter((point) => Math.sign(point.x) === side);
      expect(dial.length).toBeGreaterThan(0);
      const center = new Box3().setFromPoints(dial).getCenter(new Vector3());
      expect(center.x).toBeCloseTo(side * 0.12, 6);
      center.applyAxisAngle(new Vector3(0, 1, 0), equipmentVisualRotation(rotation) * Math.PI / 180);
      expect(center.dot(new Vector3(x, 0, z))).toBeGreaterThan(0.21);
    }
  });
});
