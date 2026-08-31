import { PROJECT_VERSION } from "../schemas/project";
import { projectItemIdFromPlacementId } from "./project-item-ids";

export const SUPPORTED_PROJECT_VERSIONS = [1, 2, 3, 4, PROJECT_VERSION] as const;
export const CURRENT_PROJECT_VERSION = PROJECT_VERSION;

export type ProjectMigrationError = {
  code: "migration-failed";
  message: string;
};

export type ProjectMigrationResult =
  | { success: true; data: unknown }
  | { success: false; error: ProjectMigrationError };

type ProjectMigration = (project: unknown) => unknown;

const migrations = new Map<number, ProjectMigration>([
  [1, migrateV1ToV2],
  [2, migrateV2ToV3],
  [3, migrateV3ToV4],
  [4, migrateV4ToV5],
]);

function migrateV1ToV2(project: unknown): unknown {
  if (typeof project !== "object" || project === null || Array.isArray(project)) {
    throw new Error("Invalid version 1 project.");
  }

  const obstacles = Reflect.get(project, "obstacles");
  const migratedObstacles = Array.isArray(obstacles)
    ? obstacles.map((obstacle) => migrateV1Obstacle(obstacle))
    : obstacles;

  return {
    ...project,
    version: 2,
    obstacles: migratedObstacles,
    wallElements: [],
  };
}

function migrateV2ToV3(project: unknown): unknown {
  if (typeof project !== "object" || project === null || Array.isArray(project)) {
    throw new Error("Invalid version 2 project.");
  }

  return { ...project, version: 3, placements: [] };
}

function migrateV3ToV4(project: unknown): unknown {
  if (typeof project !== "object" || project === null || Array.isArray(project)) {
    throw new Error("Invalid version 3 project.");
  }

  const placements = Reflect.get(project, "placements");
  if (!Array.isArray(placements)) {
    throw new Error("Version 3 project must include placements.");
  }

  const seenItemIds = new Set<string>();
  const projectItems: unknown[] = [];
  const migratedPlacements: unknown[] = [];

  for (const placement of placements) {
    if (typeof placement !== "object" || placement === null || Array.isArray(placement)) {
      throw new Error("Version 3 placements must be objects.");
    }

    const placementId = Reflect.get(placement, "id");
    const productId = Reflect.get(placement, "productId");
    if (typeof placementId !== "string" || typeof productId !== "string") {
      throw new Error("Version 3 placements must include id and productId.");
    }

    const projectItemId = projectItemIdFromPlacementId(placementId);
    if (seenItemIds.has(projectItemId)) {
      throw new Error("Derived project item IDs must be unique.");
    }
    seenItemIds.add(projectItemId);

    const placementRecord = { ...(placement as Record<string, unknown>) };
    delete placementRecord.productId;
    projectItems.push({ id: projectItemId, productId });
    migratedPlacements.push({ ...placementRecord, projectItemId });
  }

  return {
    ...project,
    version: 4,
    projectItems,
    placements: migratedPlacements,
  };
}

function migrateV4ToV5(project: unknown): unknown {
  if (typeof project !== "object" || project === null || Array.isArray(project)) {
    throw new Error("Invalid version 4 project.");
  }
  const placements = Reflect.get(project, "placements");
  if (!Array.isArray(placements)) {
    throw new Error("Version 4 project must include placements.");
  }
  return {
    ...project,
    version: 5,
    placements: placements.map((placement) => {
      if (typeof placement !== "object" || placement === null || Array.isArray(placement)) {
        throw new Error("Version 4 placements must be objects.");
      }
      return { ...placement, locked: false };
    }),
  };
}

function migrateV1Obstacle(obstacle: unknown): unknown {
  if (
    typeof obstacle !== "object" ||
    obstacle === null ||
    Array.isArray(obstacle) ||
    Reflect.get(obstacle, "kind") !== "unavailable-zone"
  ) {
    return obstacle;
  }

  const dimensions = Reflect.get(obstacle, "dimensions");
  if (
    typeof dimensions !== "object" ||
    dimensions === null ||
    Array.isArray(dimensions)
  ) {
    return obstacle;
  }

  const footprintDimensions = { ...dimensions };
  Reflect.deleteProperty(footprintDimensions, "heightCm");
  return { ...obstacle, dimensions: footprintDimensions };
}

export function migrateProjectToCurrent(
  project: unknown,
  declaredVersion: number,
): ProjectMigrationResult {
  let migrated = project;
  let version = declaredVersion;

  try {
    while (version < CURRENT_PROJECT_VERSION) {
      const migration = migrations.get(version);

      if (!migration) {
        return migrationFailure(version);
      }

      migrated = migration(migrated);
      version += 1;
    }

    return { success: true, data: migrated };
  } catch {
    return migrationFailure(version);
  }
}

function migrationFailure(version: number): ProjectMigrationResult {
  return {
    success: false,
    error: {
      code: "migration-failed",
      message: `The saved project could not be migrated from version ${version}.`,
    },
  };
}
