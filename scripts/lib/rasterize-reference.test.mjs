import { describe, expect, it } from "vitest";
import { rasterizeReference } from "./rasterize-reference.mjs";

describe("reference depth rendering", () => {
  it("keeps the nearest surface visible regardless of triangle submission order", () => {
    const triangle = (z, color) => ({ points: [{ x: 0, y: 0, z }, { x: 4, y: 0, z }, { x: 0, y: 4, z }], color });
    const near = triangle(0.2, [200, 20, 10]);
    const far = triangle(0.8, [10, 20, 200]);
    const first = rasterizeReference([near, far], 4);
    expect(first).toEqual(rasterizeReference([far, near], 4));
    expect([...first.subarray(0, 3)]).toEqual(near.color);
    expect([...first.subarray(45, 48)]).toEqual([238, 234, 229]);
  });

  it("ignores zero-area geometry and clips geometry outside the canvas", () => {
    const points = [{ x: -10, y: -10, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 10, y: 10, z: 0 }];
    expect(rasterizeReference([{ points, color: [0, 0, 0] }], 2)).toEqual(rasterizeReference([], 2));
    const outside = points.map((point) => ({ ...point, x: point.x - 30 }));
    outside[2].y = 20;
    expect(rasterizeReference([{ points: outside, color: [0, 0, 0] }], 2)).toEqual(rasterizeReference([], 2));
  });
});
