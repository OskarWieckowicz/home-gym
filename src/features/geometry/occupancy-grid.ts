import {
  rectanglesOverlap,
  type RectangleBounds,
} from "./rectangles";
import { GRID_CELL_CM } from "./access-constants";

export type OccupancyGrid = {
  readonly cols: number;
  readonly rows: number;
  readonly cellCm: number;
  readonly roomWidthCm: number;
  readonly roomDepthCm: number;
  readonly blocked: readonly boolean[];
};

export function cellBounds(ix: number, iz: number, cellCm = GRID_CELL_CM): RectangleBounds {
  return {
    minX: ix * cellCm,
    minZ: iz * cellCm,
    maxX: (ix + 1) * cellCm,
    maxZ: (iz + 1) * cellCm,
  };
}

export function cellIndex(ix: number, iz: number, cols: number): number {
  return iz * cols + ix;
}

function isPartialBoundaryCell(
  bounds: RectangleBounds,
  roomWidthCm: number,
  roomDepthCm: number,
): boolean {
  return (
    bounds.minX < 0 ||
    bounds.minZ < 0 ||
    bounds.maxX > roomWidthCm ||
    bounds.maxZ > roomDepthCm
  );
}

export function createOccupancyGrid(
  roomWidthCm: number,
  roomDepthCm: number,
  blockers: readonly RectangleBounds[] = [],
): OccupancyGrid {
  const cols = Math.max(1, Math.ceil(roomWidthCm / GRID_CELL_CM));
  const rows = Math.max(1, Math.ceil(roomDepthCm / GRID_CELL_CM));
  const blocked: boolean[] = [];

  for (let iz = 0; iz < rows; iz += 1) {
    for (let ix = 0; ix < cols; ix += 1) {
      const bounds = cellBounds(ix, iz);
      blocked.push(
        isPartialBoundaryCell(bounds, roomWidthCm, roomDepthCm) ||
          blockers.some((blocker) => rectanglesOverlap(bounds, blocker)),
      );
    }
  }

  return {
    cols,
    rows,
    cellCm: GRID_CELL_CM,
    roomWidthCm,
    roomDepthCm,
    blocked,
  };
}

export function cellsOverlappingBounds(
  grid: Pick<OccupancyGrid, "cols" | "rows" | "cellCm">,
  bounds: RectangleBounds,
): number[] {
  const minIx = Math.max(0, Math.floor(bounds.minX / grid.cellCm));
  const maxIx = Math.min(grid.cols, Math.ceil(bounds.maxX / grid.cellCm));
  const minIz = Math.max(0, Math.floor(bounds.minZ / grid.cellCm));
  const maxIz = Math.min(grid.rows, Math.ceil(bounds.maxZ / grid.cellCm));
  const indices: number[] = [];

  for (let iz = minIz; iz < maxIz; iz += 1) {
    for (let ix = minIx; ix < maxIx; ix += 1) {
      if (rectanglesOverlap(cellBounds(ix, iz, grid.cellCm), bounds)) {
        indices.push(cellIndex(ix, iz, grid.cols));
      }
    }
  }

  return indices;
}

export function expandBounds(bounds: RectangleBounds, reachCm: number): RectangleBounds {
  return {
    minX: bounds.minX - reachCm,
    minZ: bounds.minZ - reachCm,
    maxX: bounds.maxX + reachCm,
    maxZ: bounds.maxZ + reachCm,
  };
}
