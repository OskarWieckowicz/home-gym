import { describe, expect, it } from "vitest";

import { GRID_CELL_CM } from "./access-constants";
import {
  cellBounds,
  createOccupancyGrid,
  cellsOverlappingBounds,
} from "./occupancy-grid";

describe("occupancy grid", () => {
  it("rounds room size up and blocks partial boundary cells", () => {
    const exact = createOccupancyGrid(400, 320);
    expect(exact).toMatchObject({ cols: 40, rows: 32, cellCm: GRID_CELL_CM });
    expect(exact.blocked.every((cell) => cell === false)).toBe(true);

    const partial = createOccupancyGrid(405, 320);
    expect(partial.cols).toBe(41);
    expect(cellBounds(40, 0).maxX).toBe(410);
    expect(partial.blocked[40]).toBe(true);
    expect(partial.blocked[39]).toBe(false);
  });

  it("marks solid footprints blocked and ignores use zones and unavailable zones", () => {
    const physical = { minX: 40, minZ: 40, maxX: 80, maxZ: 80 };
    const withSolid = createOccupancyGrid(200, 200, [physical]);
    const empty = createOccupancyGrid(200, 200);
    const overlapping = cellsOverlappingBounds(empty, physical);
    expect(overlapping.every((index) => withSolid.blocked[index])).toBe(true);
    expect(overlapping.every((index) => empty.blocked[index] === false)).toBe(true);

    const marking = { minX: 40, minZ: 40, maxX: 80, maxZ: 80 };
    const withMarkingIgnored = createOccupancyGrid(200, 200, []);
    expect(cellsOverlappingBounds(withMarkingIgnored, marking).every(
      (index) => withMarkingIgnored.blocked[index] === false,
    )).toBe(true);
  });

  it("does not treat edge contact as occupying a cell", () => {
    const grid = createOccupancyGrid(100, 100, [
      { minX: 50, minZ: 0, maxX: 80, maxZ: 40 },
    ]);
    expect(grid.blocked[4]).toBe(false);
    expect(grid.blocked[5]).toBe(true);
  });
});
