import { readFile } from "node:fs/promises";
import { Box3, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { beforeAll, describe, expect, it } from "vitest";
import { findProductById } from "@/features/catalog/queries/catalog";
import { createEquipmentFootprints } from "@/features/geometry/equipment-footprints";
import { equipmentUseZoneToScene, placementCenterToScene } from "./scene-transform";
import { equipmentVisualRotation } from "./visual-orientation";

const product = findProductById("product_surge_compact_treadmill")!;
const room = { widthCm: 500, depthCm: 500, heightCm: 260 };
let belt: Box3;
let screen: Box3;

beforeAll(async () => {
  const bytes = await readFile("public/assets/surge-compact-treadmill.glb");
  const { scene } = await new GLTFLoader().parseAsync(new Uint8Array(bytes).buffer, "");
  const beltMesh = scene.getObjectByName("Running_belt_parts");
  const screenMesh = scene.getObjectByName("Teal_console_screen_parts");
  expect(beltMesh).toBeDefined();
  expect(screenMesh).toBeDefined();
  belt = new Box3().setFromObject(beltMesh!);
  screen = new Box3().setFromObject(screenMesh!);
});

describe("Surge treadmill geometry", () => {
  it("loads a flat running deck with the console above its front end", () => {
    const size = belt.getSize(new Vector3());
    expect(size.x).toBeCloseTo(0.49, 6);
    expect(size.y).toBeCloseTo(0.015, 6);
    expect(size.z).toBeCloseTo(1.24, 6);
    expect(belt.max.y).toBeCloseTo(0.1675, 6);
    expect(belt.max.z).toBeCloseTo(0.76, 6);
    expect(screen.max.z).toBeLessThan(-0.40);
    expect(screen.min.y).toBeGreaterThan(1.15);
  });

  it.each([
    [0, 0, -1], [90, 1, 0], [180, 0, 1], [270, -1, 0],
  ] as const)("aligns the actual belt exit with the rear zone at %s°", (rotation, rearX, rearZ) => {
    const placement = { position: { xCm: 150, zCm: 150 }, rotation };
    const rear = new Vector3(rearX, 0, rearZ);
    const yaw = equipmentVisualRotation(rotation) * Math.PI / 180;
    const exit = new Vector3(0, belt.max.y, belt.max.z).applyAxisAngle(new Vector3(0, 1, 0), yaw);
    expect(exit.dot(rear)).toBeGreaterThan(0.75);
    const consolePosition = screen.getCenter(new Vector3()).applyAxisAngle(new Vector3(0, 1, 0), yaw);
    expect(consolePosition.dot(rear)).toBeLessThan(-0.40);

    const origin = placementCenterToScene(placement, product.dimensions, room);
    const overlay = equipmentUseZoneToScene(placement, product, room);
    const offset = new Vector3(overlay.position.x - origin.x, 0, overlay.position.z - origin.z);
    expect(offset.dot(rear)).toBeCloseTo((80 - 25) / 200);
    const { physical, useZone } = createEquipmentFootprints(placement, product);
    const rearMargin = rearX < 0 ? physical.minX - useZone.minX
      : rearX > 0 ? useZone.maxX - physical.maxX
        : rearZ < 0 ? physical.minZ - useZone.minZ : useZone.maxZ - physical.maxZ;
    expect(rearMargin).toBe(80);
  });
});
