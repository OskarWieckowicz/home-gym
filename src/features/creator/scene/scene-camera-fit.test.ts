import { PerspectiveCamera, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import type { Room } from "@/features/project/schemas/project";
import { fitSceneCamera, fitSceneSelection } from "./scene-camera-fit";
import type { SceneBox } from "./scene-transform";
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
  it.each(rooms.flatMap((room) => [0.08, 0.4, 1, 1.5, 3, 8].map((aspect) => ({ room, aspect }))))(
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
      // Opposite margins must agree, including the axis that does not constrain distance.
      expect(Math.min(...corners.map(({ x }) => x)) + Math.max(...corners.map(({ x }) => x))).toBeCloseTo(0, 8);
      expect(Math.min(...corners.map(({ y }) => y)) + Math.max(...corners.map(({ y }) => y))).toBeCloseTo(0, 8);
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
  const direction = fit.position.clone().sub(fit.target);
  expect(Math.atan2(direction.x, direction.z) * 180 / Math.PI).toBeCloseTo(12);
  expect(fit.position.y).toBeGreaterThan(rooms[0].heightCm / 100);
  expect(sceneWallVisibility(fit.position)).toEqual({ top: true, right: true, bottom: false, left: true });
});

function projectedSelection(box: SceneBox, direction: Vector3, aspect: number) {
  const fit = fitSceneSelection(box, 45, aspect, direction);
  const camera = new PerspectiveCamera(45, aspect, 0.05, Math.max(40, fit.distance * 8));
  camera.position.copy(fit.position);
  camera.lookAt(fit.target);
  camera.updateMatrixWorld();
  const corners: Vector3[] = [];
  for (const x of [-box.dimensions.x / 2, box.dimensions.x / 2]) {
    for (const y of [-box.dimensions.y / 2, box.dimensions.y / 2]) {
      for (const z of [-box.dimensions.z / 2, box.dimensions.z / 2]) {
        corners.push(new Vector3(x, y, z).applyAxisAngle(new Vector3(0, 1, 0), box.rotationY)
          .add(new Vector3(box.position.x, box.position.y, box.position.z)).project(camera));
      }
    }
  }
  return { fit, corners };
}

describe("selected-entity framing", () => {
  const boxes: SceneBox[] = [
    { position: { x: -2, y: 1.1, z: 3 }, dimensions: { x: 1.3, y: 2.2, z: 1.6 }, rotationY: 0 },
    { position: { x: 2, y: 0.006, z: -1 }, dimensions: { x: 2, y: 0.012, z: 3 }, rotationY: 0 },
    { position: { x: 3, y: 1.5, z: 1 }, dimensions: { x: 1, y: 1.12, z: 0.12 }, rotationY: -Math.PI / 2 },
    { position: { x: 0, y: 2.14, z: -2 }, dimensions: { x: 1.12, y: 0.38, z: 0.54 }, rotationY: 0 },
  ];

  it.each(boxes.flatMap((box) => [0.15, 0.5, 1.5, 4].map((aspect) => ({ box, aspect }))))(
    "centers every corner of a selected envelope with context at aspect $aspect", ({ box, aspect }) => {
      const direction = new Vector3(-4, 3, 5).normalize();
      const { fit, corners } = projectedSelection(box, direction, aspect);
      expect(fit.position.clone().sub(fit.target).normalize().distanceTo(direction)).toBeLessThan(1e-10);
      for (const corner of corners) {
        expect(Math.abs(corner.x)).toBeLessThanOrEqual(0.720001);
        expect(Math.abs(corner.y)).toBeLessThanOrEqual(0.720001);
        expect(corner.z).toBeGreaterThan(-1);
        expect(corner.z).toBeLessThan(1);
      }
      expect(Math.max(...corners.flatMap(({ x, y }) => [Math.abs(x), Math.abs(y)]))).toBeCloseTo(0.72);
      for (const axis of ["x", "y"] as const) {
        expect(Math.min(...corners.map((corner) => corner[axis])) + Math.max(...corners.map((corner) => corner[axis]))).toBeCloseTo(0, 8);
      }
    },
  );

  it("keeps tiny targets outside the near plane and respects the orbit minimum", () => {
    const box = { position: { x: 1, y: 0.005, z: 1 }, dimensions: { x: 0.01, y: 0.01, z: 0.01 }, rotationY: 0 };
    const { fit, corners } = projectedSelection(box, new Vector3(0, 1, 1), 1.5);
    expect(fit.distance).toBe(0.5);
    expect(corners.every(({ z }) => z > -1 && z < 1)).toBe(true);
  });

  it.each([new Vector3(), new Vector3(NaN, 1, 0), new Vector3(0, 10, 0), new Vector3(0, -1, 0)])(
    "recovers a usable above-floor view from an unusable direction %o", (direction) => {
      const { fit, corners } = projectedSelection(boxes[0], direction, 1.5);
      expect(fit.position.y).toBeGreaterThan(fit.target.y);
      expect(corners.every(({ x, y, z }) => Number.isFinite(x + y + z) && Math.abs(x) <= 0.720001 && Math.abs(y) <= 0.720001)).toBe(true);
    },
  );
});

it("fits using the actual field of view instead of a fixed camera assumption", () => {
  const room = rooms[0];
  expect(fitSceneCamera(room, "fit", 30, 1.5).distance).toBeGreaterThan(fitSceneCamera(room, "fit", 60, 1.5).distance);
  for (const corner of projectedCorners(room, "fit", 0.8, 60)) {
    expect(Math.abs(corner.x)).toBeLessThanOrEqual(0.880001);
    expect(Math.abs(corner.y)).toBeLessThanOrEqual(0.880001);
  }
});
