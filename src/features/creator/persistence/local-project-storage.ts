import type { GymProject } from "@/features/project";
import {
  decodeProjectJson,
  serializeProject,
  type ProjectCodecError,
} from "@/features/project/serialization/project-codec";

export const LOCAL_PROJECT_STORAGE_KEY = "home-gym-creator.project";

export type ProjectStorageLike = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

export type ProjectStorageError =
  | ProjectCodecError
  | {
      code:
        | "storage-unavailable"
        | "read-failed"
        | "write-failed"
        | "clear-failed";
      message: string;
    };

export type ProjectStorageLoadResult =
  | { status: "missing" }
  | { status: "loaded"; project: GymProject }
  | { status: "failure"; error: ProjectStorageError };

export type ProjectStorageMutationResult =
  | { success: true }
  | { success: false; error: ProjectStorageError };

export type LocalProjectStorage = {
  load: () => ProjectStorageLoadResult;
  save: (project: GymProject) => ProjectStorageMutationResult;
  clear: () => ProjectStorageMutationResult;
};

export function createLocalProjectStorage(
  storage: ProjectStorageLike | null | undefined,
): LocalProjectStorage {
  return {
    load: () => loadProject(storage),
    save: (project) => saveProject(storage, project),
    clear: () => clearProject(storage),
  };
}

function loadProject(
  storage: ProjectStorageLike | null | undefined,
): ProjectStorageLoadResult {
  if (!storage) {
    return storageUnavailable();
  }

  let json: string | null;
  try {
    json = storage.getItem(LOCAL_PROJECT_STORAGE_KEY);
  } catch {
    return storageFailure(
      "read-failed",
      "The saved project could not be read from local storage.",
    );
  }

  if (json === null) {
    return { status: "missing" };
  }

  const decoded = decodeProjectJson(json);
  return decoded.success
    ? { status: "loaded", project: decoded.project }
    : { status: "failure", error: decoded.error };
}

function saveProject(
  storage: ProjectStorageLike | null | undefined,
  project: GymProject,
): ProjectStorageMutationResult {
  if (!storage) {
    return mutationStorageUnavailable();
  }

  const serialized = serializeProject(project);
  if (!serialized.success) {
    return serialized;
  }

  try {
    storage.setItem(LOCAL_PROJECT_STORAGE_KEY, serialized.json);
    return { success: true };
  } catch {
    return mutationFailure(
      "write-failed",
      "The project could not be saved to local storage.",
    );
  }
}

function clearProject(
  storage: ProjectStorageLike | null | undefined,
): ProjectStorageMutationResult {
  if (!storage) {
    return mutationStorageUnavailable();
  }

  try {
    storage.removeItem(LOCAL_PROJECT_STORAGE_KEY);
    return { success: true };
  } catch {
    return mutationFailure(
      "clear-failed",
      "The saved project could not be removed from local storage.",
    );
  }
}

function storageUnavailable(): ProjectStorageLoadResult {
  return {
    status: "failure",
    error: {
      code: "storage-unavailable",
      message: "Local project storage is unavailable.",
    },
  };
}

function mutationStorageUnavailable(): ProjectStorageMutationResult {
  return mutationFailure(
    "storage-unavailable",
    "Local project storage is unavailable.",
  );
}

function storageFailure(
  code: "read-failed",
  message: string,
): ProjectStorageLoadResult {
  return { status: "failure", error: { code, message } };
}

function mutationFailure(
  code: "storage-unavailable" | "write-failed" | "clear-failed",
  message: string,
): ProjectStorageMutationResult {
  return { success: false, error: { code, message } };
}
