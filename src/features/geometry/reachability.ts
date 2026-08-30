import { COMFORT_WIDTH_CM, GRID_CELL_CM } from "./access-constants";
import { meetsWidthClearance } from "./clearance-map";
import type { ClearanceMap } from "./clearance-map";
import type { OccupancyGrid } from "./occupancy-grid";

export type ReachabilityLabels = {
  readonly cols: number;
  readonly rows: number;
  readonly labels: readonly number[];
  readonly componentCount: number;
};

const ORTHOGONAL: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

function cellIndex(ix: number, iz: number, cols: number): number {
  return iz * cols + ix;
}

/** Derived from the widest evaluated width so seeds join every clearance layer. */
const DOOR_ENTRY_CELLS = Math.ceil(COMFORT_WIDTH_CM / 2 / GRID_CELL_CM);

function neighbors4(index: number, grid: OccupancyGrid): number[] {
  const ix = index % grid.cols;
  const iz = (index - ix) / grid.cols;
  const next: number[] = [];
  for (const [dx, dz] of ORTHOGONAL) {
    const nextX = ix + dx;
    const nextZ = iz + dz;
    if (nextX < 0 || nextZ < 0 || nextX >= grid.cols || nextZ >= grid.rows) {
      continue;
    }
    next.push(cellIndex(nextX, nextZ, grid.cols));
  }
  return next;
}

/**
 * Grow a seed set outward through unblocked cells, one orthogonal step at a
 * time. Used to join a wall-adjacent door threshold to the walkable interior,
 * and to model the last step someone takes off a walking path.
 */
export function expandThroughFreeCells(
  grid: OccupancyGrid,
  seedIndices: readonly number[],
  steps: number,
): number[] {
  const expanded = new Set(seedIndices.filter((index) => !grid.blocked[index]));
  let frontier = [...expanded];
  for (let step = 0; step < steps; step += 1) {
    const next: number[] = [];
    for (const current of frontier) {
      for (const neighbor of neighbors4(current, grid)) {
        if (grid.blocked[neighbor] || expanded.has(neighbor)) {
          continue;
        }
        expanded.add(neighbor);
        next.push(neighbor);
      }
    }
    frontier = next;
  }
  return [...expanded];
}

/** A door threshold sits against a wall, so it needs enough steps to reach the interior. */
export function expandDoorSeeds(
  grid: OccupancyGrid,
  seedIndices: readonly number[],
  steps = DOOR_ENTRY_CELLS,
): number[] {
  return expandThroughFreeCells(grid, seedIndices, steps);
}

function isPassable(
  grid: OccupancyGrid,
  clearance: ClearanceMap,
  widthCm: number,
  seedSet: ReadonlySet<number>,
  index: number,
): boolean {
  if (grid.blocked[index]) {
    return false;
  }
  return seedSet.has(index) || meetsWidthClearance(clearance.chamfer[index], widthCm);
}

/**
 * 4-connected components of cells that meet `widthCm`, plus physically free
 * door seed cells which are exempt from the clearance threshold. Labels are
 * assigned in row-major (z then x) scan order.
 */
export function labelReachableCells(
  grid: OccupancyGrid,
  clearance: ClearanceMap,
  widthCm: number,
  seedIndices: readonly number[],
): ReachabilityLabels {
  const seedSet = new Set(seedIndices.filter((index) => !grid.blocked[index]));
  const labels = new Array<number>(grid.blocked.length).fill(0);
  let componentCount = 0;

  for (let iz = 0; iz < grid.rows; iz += 1) {
    for (let ix = 0; ix < grid.cols; ix += 1) {
      const start = cellIndex(ix, iz, grid.cols);
      if (labels[start] !== 0 || !isPassable(grid, clearance, widthCm, seedSet, start)) {
        continue;
      }
      componentCount += 1;
      const stack = [start];
      labels[start] = componentCount;
      while (stack.length > 0) {
        const current = stack.pop() as number;
        const currentX = current % grid.cols;
        const currentZ = (current - currentX) / grid.cols;
        for (const [dx, dz] of ORTHOGONAL) {
          const nextX = currentX + dx;
          const nextZ = currentZ + dz;
          if (nextX < 0 || nextZ < 0 || nextX >= grid.cols || nextZ >= grid.rows) {
            continue;
          }
          const next = cellIndex(nextX, nextZ, grid.cols);
          if (labels[next] !== 0 || !isPassable(grid, clearance, widthCm, seedSet, next)) {
            continue;
          }
          labels[next] = componentCount;
          stack.push(next);
        }
      }
    }
  }

  return { cols: grid.cols, rows: grid.rows, labels, componentCount };
}

export function componentAt(
  labels: ReachabilityLabels,
  index: number,
): number {
  return labels.labels[index] ?? 0;
}
