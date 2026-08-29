import { PROJECT_VERSION } from "../schemas/project";

export const SUPPORTED_PROJECT_VERSIONS = [1, 2, PROJECT_VERSION] as const;
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
