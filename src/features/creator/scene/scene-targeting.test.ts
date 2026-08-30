import { describe, expect, it } from "vitest";
import { createDefaultProject } from "@/features/project/defaults";
import { getScenePlacementTarget, projectRayToFloor } from "./scene-targeting";
import { positionToScene } from "./scene-transform";

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
});
