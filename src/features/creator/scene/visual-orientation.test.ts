import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { Mesh, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { findProductById } from "@/features/catalog/queries/catalog";
import { createEquipmentFootprints } from "@/features/geometry/equipment-footprints";
import { getMountedWall } from "@/features/geometry/wall-mounting";
import { equipmentUseZoneToScene, placementCenterToScene } from "./scene-transform";
import { equipmentVisualRotation } from "./visual-orientation";

const room = { widthCm: 500, depthCm: 500, heightCm: 260 };
const up = new Vector3(0, 1, 0);
const northstar = findProductById("product_northstar_half_rack")!;
let safetyTip: Vector3;

beforeAll(async () => {
  const buffer = await readFile("public/assets/northstar-half-rack.glb");
  const gltf = await new GLTFLoader().parseAsync(new Uint8Array(buffer).buffer, "");
  const attachments = gltf.scene.getObjectByName("Graphite_powder_coat_parts") as Mesh;
  const positions = attachments.geometry.getAttribute("position");
  const tips: Vector3[] = [];
  for (let index = 0; index < positions.count; index += 1) {
    const point = new Vector3().fromBufferAttribute(positions, index);
    if (point.z < -0.5 && point.y > 0.8 && point.y < 1) tips.push(point);
  }
  expect(tips.length).toBeGreaterThan(0);
  safetyTip = tips.reduce((sum, point) => sum.add(point), new Vector3()).divideScalar(tips.length);
});

describe("equipment visual orientation", () => {
  it.each([
    [0, 0, 1, "top"],
    [90, -1, 0, "right"],
    [180, 0, -1, "bottom"],
    [270, 1, 0, "left"],
  ] as const)("aligns actual Northstar safety arms and front clearance at %s°", (rotation, frontX, frontZ, wall) => {
    const placement = { position: { xCm: 150, zCm: 150 }, rotation };
    const yaw = equipmentVisualRotation(rotation) * Math.PI / 180;
    const front = new Vector3(0, 0, -1).applyAxisAngle(up, yaw);
    expect(front.x).toBeCloseTo(frontX);
    expect(front.z).toBeCloseTo(frontZ);

    const rotatedTip = safetyTip.clone().applyAxisAngle(up, yaw);
    expect(rotatedTip.x * frontX + rotatedTip.z * frontZ).toBeGreaterThan(0.5);
    const origin = placementCenterToScene(placement, northstar.dimensions, room);
    const overlay = equipmentUseZoneToScene(placement, northstar, room);
    const zoneOffset = new Vector3(overlay.position.x - origin.x, 0, overlay.position.z - origin.z);
    expect(zoneOffset.dot(front)).toBeCloseTo((70 - 5) / 200);

    const { physical, useZone } = createEquipmentFootprints(placement, northstar);
    const frontMargin = frontX < 0 ? physical.minX - useZone.minX
      : frontX > 0 ? useZone.maxX - physical.maxX
        : frontZ < 0 ? physical.minZ - useZone.minZ : useZone.maxZ - physical.maxZ;
    expect(frontMargin).toBe(70);

    // The wall accessory shares this adapter: its authored +Z backplate faces the mounted wall.
    const back = new Vector3(0, 0, 1).applyAxisAngle(up, yaw);
    expect(getMountedWall(rotation)).toBe(wall);
    expect(back.x).toBeCloseTo(-frontX);
    expect(back.z).toBeCloseTo(-frontZ);
  });
});
