import { gymProjectSchema, type GymProject } from "../schemas/project";
import {
  CURRENT_PROJECT_VERSION,
  migrateProjectToCurrent,
  type ProjectMigrationError,
} from "./project-migrations";

export type ProjectCodecErrorCode =
  | "invalid-json"
  | "invalid-version"
  | "unsupported-version"
  | "migration-failed"
  | "schema-invalid";

export type ProjectCodecError = {
  code: ProjectCodecErrorCode;
  message: string;
};

export type ProjectCodecResult =
  | { success: true; project: GymProject }
  | { success: false; error: ProjectCodecError };

export type ProjectSerializationResult =
  | { success: true; json: string }
  | { success: false; error: ProjectCodecError };

export function decodeProjectJson(json: string): ProjectCodecResult {
  let input: unknown;

  try {
    input = JSON.parse(json);
  } catch {
    return failure("invalid-json", "The project file is not valid JSON.");
  }

  return decodeProject(input);
}

export function decodeProject(input: unknown): ProjectCodecResult {
  try {
    return decodeProjectValue(input);
  } catch {
    return failure(
      "schema-invalid",
      "The project does not match the supported project format.",
    );
  }
}

function decodeProjectValue(input: unknown): ProjectCodecResult {
  const version = readVersion(input);

  if (version === null) {
    return failure(
      "invalid-version",
      "The project must declare a positive integer version.",
    );
  }

  if (version > CURRENT_PROJECT_VERSION) {
    return failure(
      "unsupported-version",
      `Project version ${version} is newer than the supported version ${CURRENT_PROJECT_VERSION}.`,
    );
  }

  const migration = migrateProjectToCurrent(input, version);
  if (!migration.success) {
    return { success: false, error: toCodecError(migration.error) };
  }

  const parsed = gymProjectSchema.safeParse(migration.data);
  if (!parsed.success) {
    return failure(
      "schema-invalid",
      "The project does not match the supported project format.",
    );
  }

  return { success: true, project: parsed.data };
}

export function serializeProject(project: GymProject): ProjectSerializationResult {
  const decoded = decodeProject(project);
  if (!decoded.success) {
    return decoded;
  }

  try {
    return {
      success: true,
      json: `${JSON.stringify(decoded.project, null, 2)}\n`,
    };
  } catch {
    return failure(
      "schema-invalid",
      "The project could not be serialized in the supported project format.",
    );
  }
}

function readVersion(input: unknown): number | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return null;
  }

  const version = Reflect.get(input, "version");
  return typeof version === "number" && Number.isInteger(version) && version >= 1
    ? version
    : null;
}

function failure(
  code: ProjectCodecErrorCode,
  message: string,
): { success: false; error: ProjectCodecError } {
  return { success: false, error: { code, message } };
}

function toCodecError(error: ProjectMigrationError): ProjectCodecError {
  return error;
}
