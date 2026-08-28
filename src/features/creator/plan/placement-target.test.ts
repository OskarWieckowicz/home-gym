import { describe, expect, it } from "vitest";

import { createPlanTransform } from "./plan-transform";
import {
  centerFloorRectangle,
  centerWallElement,
  getPlacementTarget,
} from "./placement-target";

const transform = createPlanTransform(
  { widthCm: 400, depthCm: 300 },
  { width: 600, height: 500 },
  50,
);

describe("placement targets", () => {
  it("accepts only the room interior for floor tools", () => {
    expect(getPlacementTarget(
      { x: transform.offsetX + 200, y: transform.offsetY + 160 },
      transform,
      "floor",
    )).toEqual({ kind: "floor", position: { xCm: 160, zCm: 130 } });
    expect(getPlacementTarget(
      { x: transform.offsetX, y: transform.offsetY + 160 },
      transform,
      "floor",
    )).toBeNull();
  });

  it.each([
    ["top", { x: transform.offsetX + 200, y: transform.offsetY - 5 }, 160],
    ["right", { x: transform.offsetX + transform.roomWidth + 5, y: transform.offsetY + 150 }, 120],
    ["bottom", { x: transform.offsetX + 300, y: transform.offsetY + transform.roomHeight + 5 }, 240],
    ["left", { x: transform.offsetX - 5, y: transform.offsetY + 225 }, 180],
  ] as const)("maps a click near the %s wall", (wall, point, offsetCm) => {
    expect(getPlacementTarget(point, transform, "wall")).toEqual({
      kind: "wall",
      wall,
      offsetCm,
    });
  });

  it("rejects wall clicks outside the hit area", () => {
    expect(getPlacementTarget(
      { x: transform.offsetX + 200, y: transform.offsetY + 100 },
      transform,
      "wall",
    )).toBeNull();
    expect(getPlacementTarget(
      { x: transform.offsetX - 30, y: transform.offsetY - 30 },
      transform,
      "wall",
    )).toBeNull();
  });

  it("centers and clamps default floor rectangles", () => {
    expect(centerFloorRectangle(
      { xCm: 200, zCm: 150 },
      { widthCm: 100, depthCm: 50 },
      { widthCm: 400, depthCm: 300 },
    )).toEqual({ xCm: 150, zCm: 130 });
    expect(centerFloorRectangle(
      { xCm: 390, zCm: 290 },
      { widthCm: 100, depthCm: 50 },
      { widthCm: 400, depthCm: 300 },
    )).toEqual({ xCm: 300, zCm: 250 });
    expect(centerFloorRectangle(
      { xCm: 0, zCm: 0 },
      { widthCm: 500, depthCm: 50 },
      { widthCm: 400, depthCm: 300 },
    )).toBeNull();
    expect(centerFloorRectangle(
      { xCm: 400, zCm: 300 },
      { widthCm: 100, depthCm: 50 },
      { widthCm: 405, depthCm: 306 },
    )).toEqual({ xCm: 305, zCm: 256 });
  });

  it("centers and clamps wall elements", () => {
    expect(centerWallElement(200, 90, 400)).toBe(160);
    expect(centerWallElement(20, 90, 400)).toBe(0);
    expect(centerWallElement(390, 90, 400)).toBe(310);
    expect(centerWallElement(400, 90, 405)).toBe(315);
    expect(centerWallElement(200, 500, 400)).toBeNull();
  });
});
