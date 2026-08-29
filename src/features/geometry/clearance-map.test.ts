import { describe, expect, it } from "vitest";

import { CHAMFER_DIAGONAL, CHAMFER_ORTHOGONAL, GRID_CELL_CM } from "./access-constants";
import { createClearanceMap, clearanceCm, meetsWidthClearance } from "./clearance-map";
import { createOccupancyGrid } from "./occupancy-grid";

describe("clearance map", () => {
  it("uses a 3/4 chamfer as an integer Euclidean approximation", () => {
    const grid = createOccupancyGrid(50, 50, [
      { minX: 20, minZ: 20, maxX: 30, maxZ: 30 },
    ]);
    const map = createClearanceMap(grid);
    const center = 2 * grid.cols + 2;
    expect(map.chamfer[center]).toBe(0);
    expect(map.chamfer[center - 1]).toBe(CHAMFER_ORTHOGONAL);
    expect(map.chamfer[center - grid.cols]).toBe(CHAMFER_ORTHOGONAL);
    expect(map.chamfer[center - grid.cols - 1]).toBe(CHAMFER_DIAGONAL);
    expect(clearanceCm(CHAMFER_ORTHOGONAL)).toBe(GRID_CELL_CM);
    expect(meetsWidthClearance(15, 100)).toBe(true);
    expect(meetsWidthClearance(14, 100)).toBe(false);
  });

  it("is symmetric and treats the room exterior as blocked", () => {
    const grid = createOccupancyGrid(30, 50);
    const map = createClearanceMap(grid);
    expect(map.chamfer[0]).toBe(CHAMFER_ORTHOGONAL);
    expect(map.chamfer[2]).toBe(CHAMFER_ORTHOGONAL);
    expect(map.chamfer[1]).toBeGreaterThanOrEqual(CHAMFER_ORTHOGONAL);
    expect(map.chamfer).toEqual([...map.chamfer]);
    expect(map.chamfer.every((value) => Number.isInteger(value))).toBe(true);
  });
});
