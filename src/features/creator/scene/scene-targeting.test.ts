import { describe, expect, it } from "vitest";
import { createDefaultProject } from "@/features/project/defaults";
import { getScenePlacementTarget, projectRayToFloor, projectRayToRoomWall } from "./scene-targeting";
import { positionToScene } from "./scene-transform";
import { sceneWallVisibility } from "./scene-wall-visibility";

describe("scene targeting", () => {
  const room = createDefaultProject().room;
  it("converts floor targets and snaps creation coordinates like SVG", () => {
    expect(getScenePlacementTarget(positionToScene({ xCm: 116, zCm: 154 }, room), room, "floor"))
      .toEqual({ kind: "floor", position: { xCm: 120, zCm: 150 } });
  });
  it.each([
    ["top", 123, 0, 120], ["right", 400, 153, 150],
    ["bottom", 123, 320, 120], ["left", 0, 153, 150],
  ] as const)("targets the %s wall independently of camera and visual surfaces", (wall, xCm, zCm, offsetCm) => {
    expect(getScenePlacementTarget(positionToScene({ xCm, zCm }, room), room, "wall"))
      .toEqual({ kind: "wall", wall, offsetCm });
  });
  it("requires floor interiors and bounded wall-edge tolerance", () => {
    const target = (xCm: number, zCm: number, kind: "floor" | "wall") =>
      getScenePlacementTarget(positionToScene({ xCm, zCm }, room), room, kind);
    expect(target(0, 50, "floor")).toBeNull();
    expect(target(400, 50, "floor")).toBeNull();
    expect(target(150, -20, "wall")).toEqual({ kind: "wall", wall: "top", offsetCm: 150 });
    expect(target(150, -26, "wall")).toBeNull();
    expect(target(200, 160, "wall")).toBeNull();
    expect(target(-10, -10, "wall")).toBeNull();
    expect(getScenePlacementTarget(null, room, "floor")).toBeNull();
    expect(getScenePlacementTarget({ x: NaN, z: 0 }, room, "floor")).toBeNull();
  });
  it("projects rays onto floor or fixed-height gesture planes", () => {
    const ray = { origin: { x: 1, y: 3, z: 2 }, direction: { x: -1, y: -1, z: 0 } };
    expect(projectRayToFloor(ray)).toEqual({ x: -2, y: 0, z: 2 });
    expect(projectRayToFloor(ray, 1)).toEqual({ x: -1, y: 1, z: 2 });
    expect(projectRayToFloor({ ...ray, direction: { x: 1, y: 0, z: 1 } })).toBeNull();
    expect(projectRayToFloor({ ...ray, direction: { x: 0, y: 1, z: 0 } })).toBeNull();
    expect(projectRayToFloor({ ...ray, origin: { x: Infinity, y: 3, z: 2 } })).toBeNull();
  });

  it.each([
    ["top", { x: 0, y: 1.2, z: 0 }, { x: 0, y: 0, z: -1 }],
    ["right", { x: 0, y: 1.2, z: 0 }, { x: 1, y: 0, z: 0 }],
    ["bottom", { x: 0, y: 1.2, z: 0 }, { x: 0, y: 0, z: 1 }],
    ["left", { x: 0, y: 1.2, z: 0 }, { x: -1, y: 0, z: 0 }],
  ] as const)("projects a ray directly onto the visible %s wall surface", (wall, origin, direction) => {
    const visible = { top: false, right: false, bottom: false, left: false, [wall]: true };
    const point = projectRayToRoomWall({ origin, direction }, room, visible);
    expect(point).not.toBeNull();
    expect(getScenePlacementTarget(point, room, "wall")).toMatchObject({ kind: "wall", wall });
    expect(point!.y).toBe(1.2);
  });

  it("targets the shown rear wall instead of the cut-away near edge", () => {
    const camera = { x: 4, y: 4, z: 5 };
    const wallPoint = { x: 0, y: 1.2, z: -room.depthCm / 200 };
    const direction = {
      x: wallPoint.x - camera.x,
      y: wallPoint.y - camera.y,
      z: wallPoint.z - camera.z,
    };
    const visible = sceneWallVisibility(camera);
    const projected = projectRayToRoomWall({ origin: camera, direction }, room, visible);
    expect(projected?.x).toBeCloseTo(wallPoint.x);
    expect(projected?.y).toBeCloseTo(wallPoint.y);
    expect(projected?.z).toBeCloseTo(wallPoint.z);
  });

  it("does not turn a click on the floor or a hidden wall into a wall target", () => {
    const camera = { x: 0, y: 3, z: 5 };
    const visible = sceneWallVisibility(camera);
    const floorDirection = { x: 0, y: -3, z: -5 };
    expect(projectRayToRoomWall({ origin: camera, direction: floorDirection }, room, visible)).toBeNull();
    expect(projectRayToRoomWall(
      { origin: { x: 0, y: 1.2, z: 0 }, direction: { x: 0, y: 0, z: 1 } },
      room,
      { top: true, right: true, bottom: false, left: true },
    )).toBeNull();
  });
});
