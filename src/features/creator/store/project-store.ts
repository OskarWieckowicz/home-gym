import { createStore, type StoreApi } from "zustand/vanilla";

import {
  applyProjectCommand,
  defaultProjectCommandDependencies,
  type ProjectCommandDependencies,
} from "@/features/project/commands/apply-project-command";
import type { DispatchResult } from "@/features/project/commands/command-results";
import { gymProjectSchema, type GymProject } from "@/features/project/schemas/project";
import { validateProject } from "@/features/project/validation/validate-project";
import type { ValidationIssue } from "@/features/project/validation/validation-issues";

const HISTORY_LIMIT = 50;

export type ProjectStoreState = {
  readonly project: GymProject;
  readonly validation: readonly ValidationIssue[];
  readonly revision: number;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly dispatch: (command: unknown) => DispatchResult;
  readonly undo: () => boolean;
  readonly redo: () => boolean;
};

export type ProjectStore = Pick<
  StoreApi<ProjectStoreState>,
  "getState" | "getInitialState" | "subscribe"
>;

export type CreateProjectStoreOptions = {
  readonly dependencies?: ProjectCommandDependencies;
};

function cloneProjectSnapshot(project: GymProject): GymProject {
  return {
    ...project,
    room: { ...project.room },
    obstacles: project.obstacles.map((obstacle) => ({
      ...obstacle,
      position: { ...obstacle.position },
      dimensions: { ...obstacle.dimensions },
    })),
    trainingGoals: [...project.trainingGoals],
  };
}

export function createProjectStore(
  initialProject: GymProject,
  options: CreateProjectStoreOptions = {},
): ProjectStore {
  const parsedInitialProject = gymProjectSchema.parse(initialProject);
  const dependencies = options.dependencies ?? defaultProjectCommandDependencies;
  let past: GymProject[] = [];
  let future: GymProject[] = [];

  return createStore<ProjectStoreState>((set, get) => ({
    project: parsedInitialProject,
    validation: validateProject(parsedInitialProject),
    revision: 0,
    canUndo: false,
    canRedo: false,
    dispatch: (command) => {
      const current = get();
      const execution = applyProjectCommand(current.project, command, dependencies);

      if (!execution.result.ok || !execution.result.changed) {
        return { ...execution.result, revision: current.revision };
      }

      past = [...past, cloneProjectSnapshot(current.project)].slice(-HISTORY_LIMIT);
      future = [];
      const revision = current.revision + 1;
      set({
        project: execution.project,
        validation: execution.result.issues,
        revision,
        canUndo: true,
        canRedo: false,
      });

      return { ...execution.result, revision };
    },
    undo: () => {
      const previous = past.at(-1);
      if (!previous) {
        return false;
      }

      const current = get();
      past = past.slice(0, -1);
      future = [cloneProjectSnapshot(current.project), ...future];
      set({
        project: previous,
        validation: validateProject(previous),
        revision: current.revision + 1,
        canUndo: past.length > 0,
        canRedo: true,
      });
      return true;
    },
    redo: () => {
      const next = future.at(0);
      if (!next) {
        return false;
      }

      const current = get();
      future = future.slice(1);
      past = [...past, cloneProjectSnapshot(current.project)].slice(-HISTORY_LIMIT);
      set({
        project: next,
        validation: validateProject(next),
        revision: current.revision + 1,
        canUndo: true,
        canRedo: future.length > 0,
      });
      return true;
    },
  }));
}
