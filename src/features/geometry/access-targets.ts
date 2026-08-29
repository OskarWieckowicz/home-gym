import type { Wall } from "@/features/project/schemas/project";

import { REACH_CM } from "./access-constants";
import {
  cellsOverlappingBounds,
  expandBounds,
  type OccupancyGrid,
} from "./occupancy-grid";
import type { RectangleBounds } from "./rectangles";

export type AccessTargetKind = "door" | "use-zone" | "placement" | "obstacle";

export type AccessTarget = {
  readonly entityId: string;
  readonly kind: AccessTargetKind;
  readonly cells: readonly number[];
};

export type AccessDoorInput = {
  readonly id: string;
  readonly wall: Wall;
  readonly offsetCm: number;
  readonly widthCm: number;
};

export type AccessPlacementInput = {
  readonly id: string;
  readonly physical: RectangleBounds;
  readonly useZone: RectangleBounds;
  readonly hasUseZoneMargins: boolean;
};

export type AccessObstacleInput = {
  readonly id: string;
  readonly footprint: RectangleBounds;
};

export function hasUseZoneMargins(useZone: {
  readonly frontCm: number;
  readonly backCm: number;
  readonly leftCm: number;
  readonly rightCm: number;
}): boolean {
  return (
    useZone.frontCm > 0 ||
    useZone.backCm > 0 ||
    useZone.leftCm > 0 ||
    useZone.rightCm > 0
  );
}

function lastInteriorIndex(lengthCm: number, cellCm: number): number {
  return Math.floor(lengthCm / cellCm) - 1;
}

function intervalIndices(startCm: number, endCm: number, cellCm: number, count: number): number[] {
  const first = Math.max(0, Math.floor(startCm / cellCm));
  const last = Math.min(count, Math.ceil(endCm / cellCm));
  const indices: number[] = [];
  for (let index = first; index < last; index += 1) {
    indices.push(index);
  }
  return indices;
}

export function doorSeedCells(
  grid: OccupancyGrid,
  door: AccessDoorInput,
): number[] {
  const endCm = door.offsetCm + door.widthCm;
  switch (door.wall) {
    case "top":
      return intervalIndices(door.offsetCm, endCm, grid.cellCm, grid.cols)
        .map((ix) => ix);
    case "bottom": {
      const iz = lastInteriorIndex(grid.roomDepthCm, grid.cellCm);
      if (iz < 0) return [];
      return intervalIndices(door.offsetCm, endCm, grid.cellCm, grid.cols)
        .map((ix) => iz * grid.cols + ix);
    }
    case "left":
      return intervalIndices(door.offsetCm, endCm, grid.cellCm, grid.rows)
        .map((iz) => iz * grid.cols);
    case "right": {
      const ix = lastInteriorIndex(grid.roomWidthCm, grid.cellCm);
      if (ix < 0) return [];
      return intervalIndices(door.offsetCm, endCm, grid.cellCm, grid.rows)
        .map((iz) => iz * grid.cols + ix);
    }
  }
}

export function collectAccessTargets(
  grid: OccupancyGrid,
  doors: readonly AccessDoorInput[],
  placements: readonly AccessPlacementInput[],
  obstacles: readonly AccessObstacleInput[],
): AccessTarget[] {
  const targets: AccessTarget[] = doors.map((door) => ({
    entityId: door.id,
    kind: "door",
    cells: doorSeedCells(grid, door),
  }));

  for (const placement of placements) {
    if (placement.hasUseZoneMargins) {
      targets.push({
        entityId: placement.id,
        kind: "use-zone",
        cells: cellsOverlappingBounds(grid, placement.useZone),
      });
    } else {
      targets.push({
        entityId: placement.id,
        kind: "placement",
        cells: cellsOverlappingBounds(grid, expandBounds(placement.physical, REACH_CM)),
      });
    }
  }

  for (const obstacle of obstacles) {
    targets.push({
      entityId: obstacle.id,
      kind: "obstacle",
      cells: cellsOverlappingBounds(grid, expandBounds(obstacle.footprint, REACH_CM)),
    });
  }

  return targets;
}
