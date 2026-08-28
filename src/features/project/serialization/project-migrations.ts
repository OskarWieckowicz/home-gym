import { PROJECT_VERSION } from "../schemas/project";

export const SUPPORTED_PROJECT_VERSIONS = [PROJECT_VERSION] as const;
export const CURRENT_PROJECT_VERSION = PROJECT_VERSION;

export type ProjectMigrationError = {
  code: "migration-failed";
  message: string;
};

export type ProjectMigrationResult =
  | { success: true; data: unknown }
  | { success: false; error: ProjectMigrationError };

type ProjectMigration = (project: unknown) => unknown;

const migrations = new Map<number, ProjectMigration>();

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
