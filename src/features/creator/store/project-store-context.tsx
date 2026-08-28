"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";

import { createDefaultProject } from "@/features/project/defaults";
import type { GymProject } from "@/features/project/schemas/project";

import {
  createProjectStore,
  type CreateProjectStoreOptions,
  type ProjectStore,
  type ProjectStoreState,
} from "./project-store";

const ProjectStoreContext = createContext<ProjectStore | null>(null);

export type ProjectStoreProviderProps = CreateProjectStoreOptions & {
  readonly children: ReactNode;
  readonly initialProject?: GymProject;
};

export function ProjectStoreProvider({
  children,
  dependencies,
  initialProject,
}: ProjectStoreProviderProps) {
  const [store] = useState(() =>
    createProjectStore(initialProject ?? createDefaultProject(), {
      dependencies,
    }),
  );
  return (
    <ProjectStoreContext.Provider value={store}>
      {children}
    </ProjectStoreContext.Provider>
  );
}

export function useProjectStore<T>(selector: (state: ProjectStoreState) => T): T {
  const store = useProjectStoreApi();
  return useStore(store, selector);
}

export function useProjectStoreApi(): ProjectStore {
  const store = useContext(ProjectStoreContext);
  if (!store) {
    throw new Error("useProjectStore must be used inside ProjectStoreProvider.");
  }
  return store;
}
