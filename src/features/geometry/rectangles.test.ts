import { describe, expect, it } from "vitest";

import {
  createRectangleFootprint,
  getRotatedFootprintDimensions,
  intersectRectangles,
  rectanglesOverlap,
  type RectangleBounds,
} from "./rectangles";

const dimensions = { widthCm: 120, depthCm: 80, heightCm: 210 };

describe("rectangle footprints", () => {
  it.each([
    [0, { widthCm: 120, depthCm: 80 }],
    [90, { widthCm: 80, depthCm: 120 }],
    [180, { widthCm: 120, depthCm: 80 }],
    [270, { widthCm: 80, depthCm: 120 }],
  ] as const)("normalizes a %d degree rotation", (rotation, expected) => {
    expect(getRotatedFootprintDimensions(dimensions, rotation)).toEqual(expected);
  });

  it("keeps the position as the minimum corner after rotation", () => {
    expect(
      createRectangleFootprint({ xCm: 25, zCm: 40 }, dimensions, 90),
    ).toEqual({
      minX: 25,
      minZ: 40,
      maxX: 105,
      maxZ: 160,
      widthCm: 80,
      depthCm: 120,
    });
  });

  it("restores footprint dimensions after two or four quarter turns", () => {
    expect(getRotatedFootprintDimensions(dimensions, 180)).toEqual(
      getRotatedFootprintDimensions(dimensions, 0),
    );
    expect(getRotatedFootprintDimensions(dimensions, 270)).toEqual(
      getRotatedFootprintDimensions(dimensions, 90),
    );
    expect(getRotatedFootprintDimensions(dimensions, 0)).toEqual({
      widthCm: dimensions.widthCm,
      depthCm: dimensions.depthCm,
    });
  });
});

describe("rectangle intersections", () => {
  const base: RectangleBounds = { minX: 0, minZ: 0, maxX: 100, maxZ: 100 };

  it.each([
    ["partial overlap", { minX: 75, minZ: 60, maxX: 125, maxZ: 110 }, { minX: 75, minZ: 60, maxX: 100, maxZ: 100 }],
    ["full containment", { minX: 20, minZ: 30, maxX: 40, maxZ: 50 }, { minX: 20, minZ: 30, maxX: 40, maxZ: 50 }],
    ["identical rectangles", base, base],
  ] as const)("returns bounds for %s", (_label, other, expected) => {
    expect(intersectRectangles(base, other)).toEqual(expected);
    expect(intersectRectangles(other, base)).toEqual(expected);
    expect(rectanglesOverlap(base, other)).toBe(true);
    expect(rectanglesOverlap(other, base)).toBe(true);
  });

  it.each([
    ["separation", { minX: 101, minZ: 0, maxX: 150, maxZ: 50 }],
    ["edge contact", { minX: 100, minZ: 10, maxX: 150, maxZ: 50 }],
    ["corner contact", { minX: 100, minZ: 100, maxX: 150, maxZ: 150 }],
  ] as const)("does not treat %s as positive-area overlap", (_label, other) => {
    expect(intersectRectangles(base, other)).toBeNull();
    expect(intersectRectangles(other, base)).toBeNull();
    expect(rectanglesOverlap(base, other)).toBe(false);
    expect(rectanglesOverlap(other, base)).toBe(false);
  });
});
