import { createStore, type StoreApi } from "zustand/vanilla";

import {
  applyProjectCommand,
  type ProjectCommandDependencies,
} from "@/features/project/commands/apply-project-command";
import { resolveProjectCommandDependencies } from "@/features/project/commands/project-command-dependencies";
import type { DispatchResult } from "@/features/project/commands/command-results";
import { gymProjectSchema, type GymProject } from "@/features/project/schemas/project";
import {
  createProjectAnalysis,
  type ProjectAnalysis,
} from "@/features/project/validation/analyze-project";
import type { ValidationIssue } from "@/features/project/validation/validation-issues";

import {
  catalogProductResolver,
  projectUsesKnownProducts,
} from "./catalog-product-resolver";

const HISTORY_LIMIT = 50;
export type ProjectStoreState = {
  readonly project: GymProject;
  readonly validation: ProjectAnalysis;
  readonly revision: number;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly dispatch: (command: unknown) => DispatchResult;
  readonly replaceProject: (project: unknown) => ReplaceProjectResult;
  readonly undo: () => boolean;
  readonly redo: () => boolean;
};

export type ReplaceProjectResult =
  | {
      readonly ok: true;
      readonly changed: boolean;
      readonly revision: number;
      readonly issues: readonly ValidationIssue[];
    }
  | {
      readonly ok: false;
      readonly changed: false;
      readonly revision: number;
      readonly error: {
        readonly code: "INVALID_PROJECT";
        readonly message: "Project data is invalid.";
      };
    };

export type ProjectStore = Pick<
  StoreApi<ProjectStoreState>,
  "getState" | "getInitialState" | "subscribe"
>;

export type CreateProjectStoreOptions = {
  readonly dependencies?: ProjectCommandDependencies;
};

function cloneProjectSnapshot(project: GymProject): GymProject {
  return gymProjectSchema.parse(project);
}

function projectsEqual(first: GymProject, second: GymProject): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}

export function createProjectStore(
  initialProject: GymProject,
  options: CreateProjectStoreOptions = {},
): ProjectStore {
  const parsedInitialProject = gymProjectSchema.parse(initialProject);
  const dependencies = resolveProjectCommandDependencies({
    resolveProduct: catalogProductResolver,
    ...options.dependencies,
  });
  if (!projectUsesKnownProducts(parsedInitialProject, dependencies.resolveProduct)) {
    throw new Error("The initial project references an unavailable catalog product.");
  }
  let past: GymProject[] = [];
  let future: GymProject[] = [];

  return createStore<ProjectStoreState>((set, get) => ({
    project: parsedInitialProject,
    validation: dependencies.analyzeProject(parsedInitialProject),
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
        validation: createProjectAnalysis(
          execution.result.issues,
          execution.result.access,
          execution.result.items,
          execution.result.coverage,
        ),
        revision,
        canUndo: true,
        canRedo: false,
      });

      return { ...execution.result, revision };
    },
    replaceProject: (project) => {
      const current = get();
      const parsed = gymProjectSchema.safeParse(project);
      if (
        !parsed.success ||
        !projectUsesKnownProducts(parsed.data, dependencies.resolveProduct)
      ) {
        return {
          ok: false,
          changed: false,
          revision: current.revision,
          error: {
            code: "INVALID_PROJECT",
            message: "Project data is invalid.",
          },
        };
      }

      if (projectsEqual(current.project, parsed.data)) {
        return {
          ok: true,
          changed: false,
          revision: current.revision,
          issues: current.validation.issues,
        };
      }

      past = [...past, cloneProjectSnapshot(current.project)].slice(-HISTORY_LIMIT);
      future = [];
      const revision = current.revision + 1;
      const validation = dependencies.analyzeProject(parsed.data);
      set({
        project: parsed.data,
        validation,
        revision,
        canUndo: true,
        canRedo: false,
      });
      return { ok: true, changed: true, revision, issues: validation.issues };
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
        validation: dependencies.analyzeProject(previous),
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
        validation: dependencies.analyzeProject(next),
        revision: current.revision + 1,
        canUndo: true,
        canRedo: future.length > 0,
      });
      return true;
    },
  }));
}
