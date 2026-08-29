import { COMFORT_WIDTH_CM, PASSABLE_WIDTH_CM } from "./access-constants";
import { createClearanceMap } from "./clearance-map";
import {
  collectAccessTargets,
  doorSeedCells,
  type AccessDoorInput,
  type AccessObstacleInput,
  type AccessPlacementInput,
  type AccessTarget,
} from "./access-targets";
import { createOccupancyGrid } from "./occupancy-grid";
import {
  componentAt,
  expandDoorSeeds,
  labelReachableCells,
  type ReachabilityLabels,
} from "./reachability";
import type { RectangleBounds } from "./rectangles";

export type AccessFactState = "comfortable" | "tight" | "unreachable";

export type AccessFact = {
  readonly entityId: string;
  readonly kind: AccessTarget["kind"];
  readonly state: AccessFactState;
};

export type ProjectAccess = {
  readonly evaluated: boolean;
  readonly reason: "no-door" | null;
  readonly facts: readonly AccessFact[];
};

export type DoorAccessRecord = {
  readonly id: string;
  readonly seedIndices: readonly number[];
  readonly blocked: boolean;
  readonly passableComponent: number;
  readonly comfortComponent: number;
};

export type AccessEvaluation = {
  readonly access: ProjectAccess;
  readonly doors: readonly DoorAccessRecord[];
};

export const UNEVALUATED_ACCESS: ProjectAccess = {
  evaluated: false,
  reason: "no-door",
  facts: [],
};

function firstPositiveComponent(
  labels: ReachabilityLabels,
  cells: readonly number[],
): number {
  for (const cell of cells) {
    const component = componentAt(labels, cell);
    if (component > 0) {
      return component;
    }
  }
  return 0;
}

function doorSeedComponents(seeds: readonly number[]): Set<number> {
  return new Set(seeds);
}

function inDoorComponent(
  labels: ReachabilityLabels,
  index: number,
  doorComponents: ReadonlySet<number>,
): boolean {
  const component = componentAt(labels, index);
  return component > 0 && doorComponents.has(component);
}

function touchesDoorComponent(
  labels: ReachabilityLabels,
  cells: readonly number[],
  doorComponents: ReadonlySet<number>,
): boolean {
  const offsets = [0, 1, -1, labels.cols, -labels.cols];
  for (const cell of cells) {
    const ix = cell % labels.cols;
    for (const offset of offsets) {
      const neighbor = cell + offset;
      if (offset === 1 && ix + 1 >= labels.cols) continue;
      if (offset === -1 && ix === 0) continue;
      if (neighbor < 0 || neighbor >= labels.labels.length) continue;
      if (inDoorComponent(labels, neighbor, doorComponents)) {
        return true;
      }
    }
  }
  return false;
}

function targetState(
  target: AccessTarget,
  passable: ReachabilityLabels,
  comfort: ReachabilityLabels,
  doorComponents: ReadonlySet<number>,
  comfortDoorComponents: ReadonlySet<number>,
): AccessFactState {
  if (!touchesDoorComponent(passable, target.cells, doorComponents)) {
    return "unreachable";
  }
  if (!touchesDoorComponent(comfort, target.cells, comfortDoorComponents)) {
    return "tight";
  }
  return "comfortable";
}

function collectDoorRecords(
  grid: ReturnType<typeof createOccupancyGrid>,
  doors: readonly AccessDoorInput[],
  passable: ReachabilityLabels,
  comfort: ReachabilityLabels,
): DoorAccessRecord[] {
  return doors.map((door) => {
    const candidates = doorSeedCells(grid, door);
    const seedIndices = candidates.filter((index) => !grid.blocked[index]);
    return {
      id: door.id,
      seedIndices,
      blocked: seedIndices.length === 0,
      passableComponent: firstPositiveComponent(passable, seedIndices),
      comfortComponent: firstPositiveComponent(comfort, seedIndices),
    };
  });
}

export function evaluateAccess(
  room: { readonly widthCm: number; readonly depthCm: number },
  solidFootprints: readonly RectangleBounds[],
  doors: readonly AccessDoorInput[],
  placements: readonly AccessPlacementInput[],
  obstacles: readonly AccessObstacleInput[],
): AccessEvaluation {
  if (doors.length === 0) {
    return { access: UNEVALUATED_ACCESS, doors: [] };
  }

  const grid = createOccupancyGrid(room.widthCm, room.depthCm, solidFootprints);
  const clearance = createClearanceMap(grid);
  const allSeeds = expandDoorSeeds(
    grid,
    doors.flatMap((door) => doorSeedCells(grid, door)),
  );
  const passable = labelReachableCells(grid, clearance, PASSABLE_WIDTH_CM, allSeeds);
  const comfort = labelReachableCells(grid, clearance, COMFORT_WIDTH_CM, allSeeds);
  const doorRecords = collectDoorRecords(grid, doors, passable, comfort);
  const passableDoorComponents = doorSeedComponents(
    doorRecords.flatMap((door) =>
      door.seedIndices
        .map((cell) => componentAt(passable, cell))
        .filter((component) => component > 0),
    ),
  );
  const comfortDoorComponents = doorSeedComponents(
    doorRecords.flatMap((door) =>
      door.seedIndices
        .map((cell) => componentAt(comfort, cell))
        .filter((component) => component > 0),
    ),
  );
  const blockedDoorIds = new Set(
    doorRecords.filter((door) => door.blocked).map((door) => door.id),
  );
  const targets = collectAccessTargets(grid, doors, placements, obstacles);
  const facts = targets.map((target) => ({
    entityId: target.entityId,
    kind: target.kind,
    state:
      target.kind === "door" && blockedDoorIds.has(target.entityId)
        ? "unreachable"
        : targetState(
            target,
            passable,
            comfort,
            passableDoorComponents,
            comfortDoorComponents,
          ),
  }));

  return {
    access: { evaluated: true, reason: null, facts },
    doors: doorRecords,
  };
}
