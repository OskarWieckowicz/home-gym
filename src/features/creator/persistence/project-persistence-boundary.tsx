"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { ProjectCommandDependencies } from "@/features/project/commands/apply-project-command";
import { createDefaultProject } from "@/features/project/defaults";
import type { GymProject } from "@/features/project/schemas/project";

import { ProjectStoreProvider, useProjectStoreApi } from "../store/project-store-context";
import {
  createLocalProjectStorage,
  type LocalProjectStorage,
  type ProjectStorageError,
} from "./local-project-storage";

export type PersistenceStatus = {
  readonly kind:
    | "ready"
    | "saved"
    | "storage-unavailable"
    | "invalid-saved-project"
    | "save-failed";
  readonly message: string;
};

type PersistenceContextValue = {
  readonly status: PersistenceStatus;
  readonly clearStoredProject: () => boolean;
};

const PersistenceContext = createContext<PersistenceContextValue | null>(null);

export type ProjectPersistenceBoundaryProps = {
  readonly children: ReactNode;
  readonly dependencies?: ProjectCommandDependencies;
  readonly fallbackProject?: GymProject;
  readonly storage?: LocalProjectStorage;
};

type RestoredSession = {
  readonly project: GymProject;
  readonly status: PersistenceStatus;
  readonly storage: LocalProjectStorage;
};

export function ProjectPersistenceBoundary({
  children,
  dependencies,
  fallbackProject,
  storage,
}: ProjectPersistenceBoundaryProps) {
  const [session, setSession] = useState<RestoredSession | null>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const adapter = storage ?? createBrowserStorageAdapter();
      const fallback = fallbackProject ?? createDefaultProject();
      const loaded = adapter.load();
      const restored = restoreSession(loaded, fallback, adapter);
      setSession((current) => current ?? restored);
    });

    return () => {
      active = false;
    };
  }, [fallbackProject, storage]);

  if (!session) {
    return (
      <main className="creator-editor grid place-items-center" id="creator-content">
        <p className="creator-help" role="status">
          Loading saved project…
        </p>
      </main>
    );
  }

  return (
    <PersistentProjectSession
      dependencies={dependencies}
      initialProject={session.project}
      initialStatus={session.status}
      storage={session.storage}
    >
      {children}
    </PersistentProjectSession>
  );
}

export function useProjectPersistence(): PersistenceContextValue | null {
  return useContext(PersistenceContext);
}

function PersistentProjectSession({
  children,
  dependencies,
  initialProject,
  initialStatus,
  storage,
}: {
  readonly children: ReactNode;
  readonly dependencies?: ProjectCommandDependencies;
  readonly initialProject: GymProject;
  readonly initialStatus: PersistenceStatus;
  readonly storage: LocalProjectStorage;
}) {
  const [status, setStatus] = useState(initialStatus);
  const contextValue = useMemo<PersistenceContextValue>(
    () => ({
      status,
      clearStoredProject: () => {
        const result = storage.clear();
        setStatus(result.success ? READY_STATUS : saveFailureStatus(result.error));
        return result.success;
      },
    }),
    [status, storage],
  );

  return (
    <PersistenceContext.Provider value={contextValue}>
      <ProjectStoreProvider dependencies={dependencies} initialProject={initialProject}>
        <ProjectAutosave setStatus={setStatus} storage={storage} />
        {children}
      </ProjectStoreProvider>
    </PersistenceContext.Provider>
  );
}

function ProjectAutosave({
  setStatus,
  storage,
}: {
  readonly setStatus: (status: PersistenceStatus) => void;
  readonly storage: LocalProjectStorage;
}) {
  const store = useProjectStoreApi();

  useEffect(
    () =>
      store.subscribe((state, previousState) => {
        if (state.project === previousState.project) return;

        const result = storage.save(state.project);
        setStatus(result.success ? SAVED_STATUS : saveFailureStatus(result.error));
      }),
    [setStatus, storage, store],
  );

  return null;
}

const READY_STATUS: PersistenceStatus = {
  kind: "ready",
  message: "Local saving ready.",
};

const SAVED_STATUS: PersistenceStatus = {
  kind: "saved",
  message: "Saved locally.",
};

function restoreSession(
  loaded: ReturnType<LocalProjectStorage["load"]>,
  fallback: GymProject,
  storage: LocalProjectStorage,
): RestoredSession {
  if (loaded.status === "loaded") {
    return { project: loaded.project, status: SAVED_STATUS, storage };
  }
  if (loaded.status === "missing") {
    return { project: fallback, status: READY_STATUS, storage };
  }

  return {
    project: fallback,
    status: restoreFailureStatus(loaded.error),
    storage,
  };
}

function restoreFailureStatus(error: ProjectStorageError): PersistenceStatus {
  if (
    error.code === "invalid-json" ||
    error.code === "invalid-version" ||
    error.code === "unsupported-version" ||
    error.code === "migration-failed" ||
    error.code === "schema-invalid"
  ) {
    return {
      kind: "invalid-saved-project",
      message: "The saved project is invalid. Editing continues in memory.",
    };
  }

  return {
    kind: "storage-unavailable",
    message: "Local saving is unavailable. Editing continues in memory.",
  };
}

function saveFailureStatus(error: ProjectStorageError): PersistenceStatus {
  return {
    kind: "save-failed",
    message:
      error.code === "clear-failed"
        ? "The saved project could not be cleared. Editing continues in memory."
        : "The latest project could not be saved. Editing continues in memory.",
  };
}

function createBrowserStorageAdapter(): LocalProjectStorage {
  try {
    return createLocalProjectStorage(window.localStorage);
  } catch {
    return createLocalProjectStorage(undefined);
  }
}
