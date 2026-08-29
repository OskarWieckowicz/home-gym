import {
  CHAMFER_DIAGONAL,
  CHAMFER_ORTHOGONAL,
  GRID_CELL_CM,
} from "./access-constants";
import type { OccupancyGrid } from "./occupancy-grid";

/**
 * Integer 3/4 chamfer distance to the nearest blocked cell or room exterior.
 * Orthogonal steps cost 3, diagonals cost 4. Convert to centimetres with
 * `(chamfer * GRID_CELL_CM) / CHAMFER_ORTHOGONAL`. This is an approximation of
 * Euclidean distance, not an exact millimetre measurement.
 */
export type ClearanceMap = {
  readonly cols: number;
  readonly rows: number;
  readonly chamfer: readonly number[];
};

const UNVISITED = 1_000_000;

function neighborChamfer(
  chamfer: readonly number[],
  cols: number,
  rows: number,
  ix: number,
  iz: number,
  weight: number,
): number {
  if (ix < 0 || iz < 0 || ix >= cols || iz >= rows) {
    return weight;
  }
  return chamfer[cellIndex(ix, iz, cols)] + weight;
}

function cellIndex(ix: number, iz: number, cols: number): number {
  return iz * cols + ix;
}

export function createClearanceMap(grid: OccupancyGrid): ClearanceMap {
  const { cols, rows, blocked } = grid;
  const chamfer: number[] = blocked.map((isBlocked) => (isBlocked ? 0 : UNVISITED));

  for (let iz = 0; iz < rows; iz += 1) {
    for (let ix = 0; ix < cols; ix += 1) {
      const index = cellIndex(ix, iz, cols);
      chamfer[index] = Math.min(
        chamfer[index],
        neighborChamfer(chamfer, cols, rows, ix - 1, iz, CHAMFER_ORTHOGONAL),
        neighborChamfer(chamfer, cols, rows, ix - 1, iz - 1, CHAMFER_DIAGONAL),
        neighborChamfer(chamfer, cols, rows, ix, iz - 1, CHAMFER_ORTHOGONAL),
        neighborChamfer(chamfer, cols, rows, ix + 1, iz - 1, CHAMFER_DIAGONAL),
      );
    }
  }

  for (let iz = rows - 1; iz >= 0; iz -= 1) {
    for (let ix = cols - 1; ix >= 0; ix -= 1) {
      const index = cellIndex(ix, iz, cols);
      chamfer[index] = Math.min(
        chamfer[index],
        neighborChamfer(chamfer, cols, rows, ix + 1, iz, CHAMFER_ORTHOGONAL),
        neighborChamfer(chamfer, cols, rows, ix + 1, iz + 1, CHAMFER_DIAGONAL),
        neighborChamfer(chamfer, cols, rows, ix, iz + 1, CHAMFER_ORTHOGONAL),
        neighborChamfer(chamfer, cols, rows, ix - 1, iz + 1, CHAMFER_DIAGONAL),
      );
    }
  }

  return { cols, rows, chamfer };
}

export function clearanceCm(chamfer: number): number {
  return (chamfer * GRID_CELL_CM) / CHAMFER_ORTHOGONAL;
}

/** True when the chamfer value is at least half `widthCm` under the 3/4 metric. */
export function meetsWidthClearance(chamfer: number, widthCm: number): boolean {
  return chamfer * GRID_CELL_CM * 2 >= widthCm * CHAMFER_ORTHOGONAL;
}
