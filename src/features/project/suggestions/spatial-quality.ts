import { createEquipmentFootprints } from "@/features/geometry/equipment-footprints";
import {
  cellsOverlappingBounds,
  createOccupancyGrid,
  type OccupancyGrid,
} from "@/features/geometry/occupancy-grid";
import type { RectangleBounds } from "@/features/geometry/rectangles";

import type { GymProject, Room } from "../schemas/project";
import type { ProjectValidationDependencies } from "../validation/product-validation";
import { collectObstacles, resolvePlacements } from "../validation/validation-model";

export type SpatialQualityMetrics = {
  readonly perimeterDistanceCm: number;
  readonly cornerDistanceCm: number;
  readonly furnitureClearanceDistanceCm: number | null;
  readonly contiguousFreeAreaCells: number;
  readonly centralFreeAreaCells: number;
};

export type SpatialQualityPreparation = {
  readonly room: Room;
  readonly baseGrid: OccupancyGrid;
  readonly furnitureFunctionalFootprints: readonly RectangleBounds[];
};

export type SpatialQualityPreparationOptions = {
  /** Omit the old footprint when evaluating a move of an existing placement. */
  readonly excludedPlacementId?: string;
};

/**
 * Builds the project-invariant occupancy state once for a candidate search.
 * Callers moving an existing placement must exclude its old placement ID.
 */
export function prepareSpatialQuality(
  project: GymProject,
  dependencies: ProjectValidationDependencies,
  options: SpatialQualityPreparationOptions = {},
): SpatialQualityPreparation {
  const obstacles = collectObstacles(project);
  const furnitureFunctionalFootprints = obstacles
    .filter(({ obstacle, hasFunctionalClearance }) =>
      obstacle.kind === "obstacle" && hasFunctionalClearance)
    .map(({ functionalFootprint }) => functionalFootprint);
  const obstacleBlockers = obstacles.flatMap((obstacle) => [
    obstacle.footprint,
    ...(obstacle.hasFunctionalClearance ? [obstacle.functionalFootprint] : []),
  ]);
  const equipmentBlockers = resolvePlacements(project, dependencies)
    .filter(({ placement }) => placement.id !== options.excludedPlacementId)
    .map(({ footprints }) => footprints.useZone);

  return {
    room: project.room,
    baseGrid: createOccupancyGrid(
      project.room.widthCm,
      project.room.depthCm,
      [...obstacleBlockers, ...equipmentBlockers],
    ),
    furnitureFunctionalFootprints,
  };
}

function axisGap(firstMin: number, firstMax: number, secondMin: number, secondMax: number) {
  return Math.max(0, firstMin - secondMax, secondMin - firstMax);
}

function manhattanGap(first: RectangleBounds, second: RectangleBounds): number {
  return axisGap(first.minX, first.maxX, second.minX, second.maxX)
    + axisGap(first.minZ, first.maxZ, second.minZ, second.maxZ);
}

function wallDistances(room: Room, footprint: RectangleBounds): readonly number[] {
  return [
    footprint.minX,
    footprint.minZ,
    room.widthCm - footprint.maxX,
    room.depthCm - footprint.maxZ,
  ].map((distance) => Math.max(0, distance));
}

function candidateGrid(baseGrid: OccupancyGrid, footprint: RectangleBounds): OccupancyGrid {
  const blocked = [...baseGrid.blocked];
  for (const index of cellsOverlappingBounds(baseGrid, footprint)) blocked[index] = true;
  return { ...baseGrid, blocked };
}

type ComponentMetrics = {
  readonly largest: number;
  readonly central: number;
};

function adjacentIndices(index: number, grid: OccupancyGrid): number[] {
  const x = index % grid.cols;
  const z = Math.floor(index / grid.cols);
  return [
    x > 0 ? index - 1 : -1,
    x + 1 < grid.cols ? index + 1 : -1,
    z > 0 ? index - grid.cols : -1,
    z + 1 < grid.rows ? index + grid.cols : -1,
  ];
}

function measureFreeComponent(
  start: number,
  centerIndex: number,
  grid: OccupancyGrid,
  visited: Uint8Array,
): { readonly size: number; readonly containsCenter: boolean } {
  const pending = [start];
  visited[start] = 1;
  let size = 0;
  let containsCenter = false;

  while (pending.length > 0) {
    const current = pending.pop();
    if (current === undefined) break;
    size += 1;
    containsCenter ||= current === centerIndex;
    for (const neighbor of adjacentIndices(current, grid)) {
      if (neighbor < 0 || grid.blocked[neighbor] || visited[neighbor]) continue;
      visited[neighbor] = 1;
      pending.push(neighbor);
    }
  }
  return { size, containsCenter };
}

function freeComponentMetrics(grid: OccupancyGrid): ComponentMetrics {
  const visited = new Uint8Array(grid.blocked.length);
  const centerX = Math.floor((grid.cols - 1) / 2);
  const centerZ = Math.floor((grid.rows - 1) / 2);
  const centerIndex = centerZ * grid.cols + centerX;
  let largest = 0;
  let central = 0;

  for (let start = 0; start < grid.blocked.length; start += 1) {
    if (grid.blocked[start] || visited[start]) continue;
    const component = measureFreeComponent(start, centerIndex, grid, visited);
    largest = Math.max(largest, component.size);
    if (component.containsCenter) central = component.size;
  }
  return { largest, central };
}

function resolveCandidateUseZone(
  project: GymProject,
  dependencies: ProjectValidationDependencies,
  placementId: string,
): RectangleBounds {
  const placement = project.placements.find(({ id }) => id === placementId);
  if (!placement) throw new TypeError(`Candidate placement ${placementId} was not found.`);
  const item = project.projectItems.find(({ id }) => id === placement.projectItemId);
  const product = item ? dependencies.resolveProduct?.(item.productId) : undefined;
  if (!product) throw new TypeError(`Product for candidate placement ${placementId} was not found.`);
  return createEquipmentFootprints(placement, product).useZone;
}

/**
 * Scores one successfully applied candidate without rebuilding invariant blockers.
 * For an even number of cells, the lower-index central cell is chosen on each axis;
 * a blocked central cell has a central component size of zero.
 */
export function measureSpatialQuality(
  preparation: SpatialQualityPreparation,
  appliedProject: GymProject,
  dependencies: ProjectValidationDependencies,
  candidatePlacementId: string,
): SpatialQualityMetrics {
  const useZone = resolveCandidateUseZone(appliedProject, dependencies, candidatePlacementId);
  const walls = wallDistances(preparation.room, useZone);
  const components = freeComponentMetrics(candidateGrid(preparation.baseGrid, useZone));
  const furnitureDistances = preparation.furnitureFunctionalFootprints
    .map((footprint) => manhattanGap(useZone, footprint));

  return {
    perimeterDistanceCm: Math.min(...walls),
    cornerDistanceCm: Math.min(walls[0], walls[2]) + Math.min(walls[1], walls[3]),
    furnitureClearanceDistanceCm: furnitureDistances.length > 0
      ? Math.min(...furnitureDistances)
      : null,
    contiguousFreeAreaCells: components.largest,
    centralFreeAreaCells: components.central,
  };
}
