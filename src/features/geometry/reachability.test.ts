import { describe, expect, it } from "vitest";

import { PASSABLE_WIDTH_CM } from "./access-constants";
import { createClearanceMap } from "./clearance-map";
import { createOccupancyGrid } from "./occupancy-grid";
import { labelReachableCells } from "./reachability";

describe("reachability labels", () => {
  it("assigns component ids in scan order", () => {
    const grid = createOccupancyGrid(80, 40);
    const labels = labelReachableCells(
      grid,
      createClearanceMap(grid),
      PASSABLE_WIDTH_CM,
      [0, 4],
    );
    expect(labels.labels[0]).toBe(1);
    expect(labels.componentCount).toBeGreaterThan(0);
  });

  it("separates two pockets split by a 100 cm blocking bar", () => {
    const grid = createOccupancyGrid(400, 400, [
      { minX: 0, minZ: 150, maxX: 400, maxZ: 220 },
    ]);
    const seeds = [15, 39 * 40 + 15];
    const labels = labelReachableCells(
      grid,
      createClearanceMap(grid),
      PASSABLE_WIDTH_CM,
      seeds,
    );
    expect(labels.labels[seeds[0]]).not.toBe(0);
    expect(labels.labels[seeds[1]]).not.toBe(0);
    expect(labels.labels[seeds[0]]).not.toBe(labels.labels[seeds[1]]);
  });

  it("does not treat a gap under 100 cm as passable away from door seeds", () => {
    const grid = createOccupancyGrid(400, 200, [
      { minX: 0, minZ: 0, maxX: 155, maxZ: 200 },
      { minX: 245, minZ: 0, maxX: 400, maxZ: 200 },
    ]);
    const labels = labelReachableCells(
      grid,
      createClearanceMap(grid),
      PASSABLE_WIDTH_CM,
      [20],
    );
    const corridor = 10 * grid.cols + 20;
    expect(grid.blocked[corridor]).toBe(false);
    expect(labels.labels[corridor]).toBe(0);
  });
});
