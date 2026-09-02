import { describe, expect, it } from "vitest";

import type { Wall } from "@/features/project/schemas/project";

import { collectAccessTargets, doorSeedCells, hasUseZoneMargins } from "./access-targets";
import { createOccupancyGrid } from "./occupancy-grid";

const room = { widthCm: 400, depthCm: 320 };

describe("access targets", () => {
  it("collects door seeds on each wall", () => {
    const grid = createOccupancyGrid(room.widthCm, room.depthCm);
    const walls: Wall[] = ["top", "right", "bottom", "left"];
    for (const wall of walls) {
      const cells = doorSeedCells(grid, {
        id: "wall-element_door",
        wall,
        offsetCm: 40,
        widthCm: 80,
      });
      expect(cells.length).toBeGreaterThan(0);
      expect(cells.every((index) => !grid.blocked[index])).toBe(true);
    }
  });

  it("uses the use zone when margins are declared and reach cells when they are not", () => {
    expect(hasUseZoneMargins({ frontCm: 20, backCm: 0, leftCm: 0, rightCm: 0 })).toBe(true);
    expect(hasUseZoneMargins({ frontCm: 0, backCm: 0, leftCm: 0, rightCm: 0 })).toBe(false);

    const grid = createOccupancyGrid(room.widthCm, room.depthCm);
    const physical = { minX: 100, minZ: 100, maxX: 160, maxZ: 150 };
    const useZone = { minX: 80, minZ: 80, maxX: 200, maxZ: 220 };
    const withMargins = collectAccessTargets(
      grid,
      [],
      [{ id: "placement_a", physical, useZone, hasUseZoneMargins: true }],
      [],
    );
    const withoutMargins = collectAccessTargets(
      grid,
      [],
      [{ id: "placement_b", physical, useZone: physical, hasUseZoneMargins: false }],
      [],
    );
    expect(withMargins[0]?.kind).toBe("use-zone");
    expect(withoutMargins[0]?.kind).toBe("placement");
    expect(withoutMargins[0]?.cells.length).toBeGreaterThan(0);
    expect(withMargins[0]?.cells.length).toBeGreaterThan(0);
  });

  it("keeps physical obstacles as approach targets and ignores unavailable zones", () => {
    const grid = createOccupancyGrid(room.widthCm, room.depthCm);
    const footprint = { minX: 40, minZ: 40, maxX: 80, maxZ: 80 };
    const targets = collectAccessTargets(
      grid,
      [],
      [],
      [{
        id: "obstacle_column",
        footprint,
        functionalFootprint: footprint,
        hasFunctionalClearance: false,
      }],
    );
    expect(targets).toHaveLength(1);
    expect(targets[0]?.kind).toBe("obstacle");
  });

  it("uses declared functional clearance as the obstacle access target", () => {
    const grid = createOccupancyGrid(room.widthCm, room.depthCm);
    const footprint = { minX: 100, minZ: 100, maxX: 150, maxZ: 150 };
    const functionalFootprint = { minX: 100, minZ: 100, maxX: 150, maxZ: 230 };
    const [target] = collectAccessTargets(grid, [], [], [{
      id: "obstacle_wardrobe",
      footprint,
      functionalFootprint,
      hasFunctionalClearance: true,
    }]);
    const legacy = collectAccessTargets(grid, [], [], [{
      id: "obstacle_legacy",
      footprint,
      functionalFootprint: footprint,
      hasFunctionalClearance: false,
    }])[0];

    expect(target?.kind).toBe("obstacle");
    expect(target?.cells).not.toEqual(legacy?.cells);
    expect(target?.cells.length).toBeLessThan(legacy?.cells.length ?? 0);
  });
});
