import { describe, expect, it } from "vitest";
import { calculateFloorArea } from "./floor-area";

const room = { widthCm: 400, depthCm: 300 };

describe("calculateFloorArea", () => {
  it("leaves an empty room completely free", () => {
    expect(calculateFloorArea(room, [])).toEqual({
      roomAreaCm2: 120_000, occupiedAreaCm2: 0, freeAreaCm2: 120_000, freeRatio: 1,
    });
  });

  it("subtracts exact obstacle footprints instead of occupancy grid cells", () => {
    const result = calculateFloorArea(room, [{ minX: 3, minZ: 7, maxX: 104, maxZ: 58 }]);
    expect(result.occupiedAreaCm2).toBe(5_151);
    expect(result.freeAreaCm2).toBe(114_849);
    expect(result.freeRatio).toBe(114_849 / 120_000);
  });

  it("counts overlaps, contained shapes and duplicates once", () => {
    const first = { minX: 0, minZ: 0, maxX: 100, maxZ: 100 };
    const second = { minX: 50, minZ: 50, maxX: 150, maxZ: 150 };
    expect(calculateFloorArea(room, [first, second, first, { minX: 10, minZ: 10, maxX: 20, maxZ: 20 }]).occupiedAreaCm2)
      .toBe(17_500);
  });

  it("clips invalid placements to the room so outside floor is never subtracted", () => {
    expect(calculateFloorArea(room, [
      { minX: -100, minZ: -100, maxX: 100, maxZ: 100 },
      { minX: 390, minZ: 290, maxX: 500, maxZ: 500 },
      { minX: 500, minZ: 500, maxX: 600, maxZ: 600 },
    ]).occupiedAreaCm2).toBe(10_100);
  });

  it("counts touching and disjoint rectangles without introducing gaps or overlap", () => {
    expect(calculateFloorArea(room, [
      { minX: 0, minZ: 0, maxX: 100, maxZ: 100 },
      { minX: 100, minZ: 0, maxX: 200, maxZ: 100 },
      { minX: 100, minZ: 200, maxX: 200, maxZ: 300 },
    ]).occupiedAreaCm2).toBe(30_000);
  });

  it("can cover the entire floor exactly", () => {
    expect(calculateFloorArea(room, [{ minX: -1, minZ: -1, maxX: 500, maxZ: 500 }]))
      .toEqual({ roomAreaCm2: 120_000, occupiedAreaCm2: 120_000, freeAreaCm2: 0, freeRatio: 0 });
  });

  it("is order-independent and does not mutate inputs", () => {
    const footprints = Object.freeze([
      Object.freeze({ minX: 20, minZ: 20, maxX: 140, maxZ: 140 }),
      Object.freeze({ minX: 0, minZ: 0, maxX: 100, maxZ: 100 }),
    ]);
    expect(calculateFloorArea(room, footprints)).toEqual(calculateFloorArea(room, [...footprints].reverse()));
  });
});
