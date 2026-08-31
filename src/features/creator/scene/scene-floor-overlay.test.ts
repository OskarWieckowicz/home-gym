import { describe, expect, it } from "vitest";
import { floorHatchSegments, floorRectanglePoints } from "./scene-floor-overlay";

describe("floor overlay presentation geometry", () => {
  it.each([{ x: 0.1, y: 0, z: 0.2 }, { x: 2, y: 0, z: 1.5 }, { x: 0.3, y: 0, z: 8 }])(
    "clips hatch segments to the floor area $x × $z", (dimensions) => {
      const points = floorHatchSegments(dimensions);
      expect(points.length).toBeGreaterThanOrEqual(2);
      expect(points.length % 2).toBe(0);
      for (let i = 0; i < points.length; i += 2) {
        const [start, end] = [points[i], points[i + 1]];
        expect(end[0] - start[0]).toBeCloseTo(end[2] - start[2]);
        expect(end[0]).toBeGreaterThan(start[0]);
        for (const [x, y, z] of [start, end]) {
          expect(Math.abs(x)).toBeLessThanOrEqual(dimensions.x / 2 + 1e-10);
          expect(Math.abs(z)).toBeLessThanOrEqual(dimensions.z / 2 + 1e-10);
          expect(y).toBeGreaterThan(0);
          expect(Math.abs(Math.abs(x) - dimensions.x / 2) < 1e-10 || Math.abs(Math.abs(z) - dimensions.z / 2) < 1e-10).toBe(true);
        }
      }
    },
  );

  it("closes the perimeter at the exact footprint dimensions", () => {
    const points = floorRectanglePoints({ x: 4, y: 0, z: 2 });
    expect(points).toHaveLength(5);
    expect(points[0]).toEqual(points.at(-1));
    expect(new Set(points.map(([x]) => x))).toEqual(new Set([-2, 2]));
    expect(new Set(points.map(([, , z]) => z))).toEqual(new Set([-1, 1]));
  });
});
