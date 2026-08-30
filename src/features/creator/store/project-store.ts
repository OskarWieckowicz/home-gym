import { createStore, type StoreApi } from "zustand/vanilla";

import {
  applyProjectCommand,
  type ProjectCommandDependencies,
} from "@/features/project/commands/apply-project-command";
import { resolveProjectCommandDependencies } from "@/features/project/commands/project-command-dependencies";
import type { DispatchResult } from "@/features/project/commands/command-results";
import {
  applyProjectCommands,
  type BatchDispatchResult,
  type ProjectCommandsExecution,
} from "@/features/project/commands/apply-project-commands";
import { previewProjectCommands } from "@/features/project/commands/preview-project-commands";
import { scoreCandidate } from "@/features/project/suggestions/candidate-scoring";
import type { PlacementSuggestionRequest } from "@/features/project/suggestions/request-schema";
import {
  suggestPlacements,
  type PlacementSuggestions,
} from "@/features/project/suggestions/suggest-placements";
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
import { reconcileCatalogProject } from "./reconcile-catalog-project";

const HISTORY_LIMIT = 50;
export type ProjectStoreState = {
  readonly project: GymProject;
  readonly validation: ProjectAnalysis;
  readonly revision: number;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly dispatch: (command: unknown) => DispatchResult;
  readonly dispatchBatch: (commands: unknown) => BatchDispatchResult;
  readonly previewBatch: (commands: unknown) => ProjectCommandsExecution;
  readonly suggestPlacements: (request: PlacementSuggestionRequest) => PlacementSuggestions;
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
      readonly reconciledSignalBands?: boolean;
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
  const dependencies = resolveProjectCommandDependencies({
    resolveProduct: catalogProductResolver,
    ...options.dependencies,
  });
  const parsedInitialProject = reconcileCatalogProject(
    gymProjectSchema.parse(initialProject), dependencies.resolveProduct,
  );
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
    previewBatch: (commands) => previewProjectCommands(get().project, commands, dependencies),
    suggestPlacements: (request) => suggestPlacements(get().project, request, {
      ...dependencies,
      candidateIdPrefix: "candidate",
    }),
    dispatchBatch: (commands) => {
      const current = get();
      const execution = applyProjectCommands(current.project, commands, dependencies);
      const result = execution.result;
      if (!result.ok) return { ...result, revision: current.revision };

      const scoring = scoreCandidate(result.analysis);
      if (scoring.rejected) {
        return {
          ok: false,
          commandType: "LAYOUT_CHANGES_APPLIED",
          revision: current.revision,
          error: {
            index: null,
            commandType: null,
            code: "INVALID_COMMAND",
            message: "The batch leaves layout errors or unreachable entities.",
          },
          analysis: result.analysis,
          reasons: scoring.reasons,
        };
      }
      if (!result.changed) return { ...result, revision: current.revision };

      past = [...past, cloneProjectSnapshot(current.project)].slice(-HISTORY_LIMIT);
      future = [];
      const revision = current.revision + 1;
      set({
        project: execution.project,
        validation: result.analysis,
        revision,
        canUndo: true,
        canRedo: false,
      });
      return { ...result, revision };
    },
    replaceProject: (project) => {
      const current = get();
      const parsed = gymProjectSchema.safeParse(project);
      const reconciled = parsed.success
        ? reconcileCatalogProject(parsed.data, dependencies.resolveProduct)
        : undefined;
      if (
        !reconciled ||
        !projectUsesKnownProducts(reconciled, dependencies.resolveProduct)
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

      const compatibility = parsed.success && reconciled !== parsed.data
        ? { reconciledSignalBands: true as const }
        : {};
      if (projectsEqual(current.project, reconciled)) {
        return {
          ...compatibility,
          ok: true,
          changed: false,
          revision: current.revision,
          issues: current.validation.issues,
        };
      }

      past = [...past, cloneProjectSnapshot(current.project)].slice(-HISTORY_LIMIT);
      future = [];
      const revision = current.revision + 1;
      const validation = dependencies.analyzeProject(reconciled);
      set({
        project: reconciled,
        validation,
        revision,
        canUndo: true,
        canRedo: false,
      });
      return { ok: true, changed: true, revision, issues: validation.issues, ...compatibility };
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
