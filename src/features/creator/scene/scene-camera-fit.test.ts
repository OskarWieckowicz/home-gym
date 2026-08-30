import { PerspectiveCamera, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import type { Room } from "@/features/project/schemas/project";
import { fitSceneCamera } from "./scene-camera-fit";
import { sceneWallVisibility } from "./scene-wall-visibility";

function projectedCorners(room: Room, kind: "fit" | "top", aspect: number, fov = 45) {
  const fit = fitSceneCamera(room, kind, fov, aspect);
  const camera = new PerspectiveCamera(fov, aspect, 0.01, Math.max(200, fit.distance * 20));
  camera.position.copy(fit.position);
  camera.lookAt(fit.target);
  camera.updateMatrixWorld();
  const corners: Vector3[] = [];
  for (const x of [-room.widthCm / 200, room.widthCm / 200]) {
    for (const y of [0, room.heightCm / 100]) {
      for (const z of [-room.depthCm / 200, room.depthCm / 200]) {
        corners.push(new Vector3(x, y, z).project(camera));
      }
    }
  }
  return corners;
}

const rooms: Room[] = [
  { widthCm: 400, depthCm: 320, heightCm: 240 },
  { widthCm: 1200, depthCm: 200, heightCm: 260 },
  { widthCm: 200, depthCm: 1200, heightCm: 260 },
  { widthCm: 200, depthCm: 200, heightCm: 900 },
  { widthCm: 1200, depthCm: 1200, heightCm: 200 },
];

describe.each(["fit", "top"] as const)("%s camera fit", (kind) => {
  it.each(rooms.flatMap((room) => [0.4, 1, 1.5, 3].map((aspect) => ({ room, aspect }))))(
    "keeps every corner inside the frustum with margin for $room at aspect $aspect", ({ room, aspect }) => {
      const corners = projectedCorners(room, kind, aspect);
      for (const corner of corners) {
        expect(Math.abs(corner.x)).toBeLessThanOrEqual(0.880001);
        expect(Math.abs(corner.y)).toBeLessThanOrEqual(0.880001);
        expect(corner.z).toBeGreaterThan(-1);
        expect(corner.z).toBeLessThan(1);
      }
      // At least one dimension uses the available frame, even for unusual rooms.
      expect(Math.max(...corners.flatMap(({ x, y }) => [Math.abs(x), Math.abs(y)]))).toBeCloseTo(0.88);
    },
  );
});

it("fills at least 75% of a typical desktop frame height", () => {
  const corners = projectedCorners(rooms[0], "fit", 1.5);
  const screenHeight = (Math.max(...corners.map(({ y }) => y)) - Math.min(...corners.map(({ y }) => y))) / 2;
  expect(screenHeight).toBeGreaterThan(0.75);
  expect(screenHeight).toBeLessThanOrEqual(0.88);
});

it("starts near frontal with both side walls visible and an elevated floor view", () => {
  const fit = fitSceneCamera(rooms[0], "fit", 45, 1.5);
  expect(Math.atan2(fit.position.x, fit.position.z) * 180 / Math.PI).toBeCloseTo(12);
  expect(fit.position.y).toBeGreaterThan(rooms[0].heightCm / 100);
  expect(sceneWallVisibility(fit.position)).toEqual({ top: true, right: true, bottom: false, left: true });
});

it("fits using the actual field of view instead of a fixed camera assumption", () => {
  const room = rooms[0];
  expect(fitSceneCamera(room, "fit", 30, 1.5).distance).toBeGreaterThan(fitSceneCamera(room, "fit", 60, 1.5).distance);
  for (const corner of projectedCorners(room, "fit", 0.8, 60)) {
    expect(Math.abs(corner.x)).toBeLessThanOrEqual(0.880001);
    expect(Math.abs(corner.y)).toBeLessThanOrEqual(0.880001);
  }
});
