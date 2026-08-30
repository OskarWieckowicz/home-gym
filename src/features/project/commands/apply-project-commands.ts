import type { GymProject } from "../schemas/project";
import type { ProjectCommandType } from "../schemas/project-command";
import { diffAccessImpact, EMPTY_ACCESS_IMPACT } from "../validation/access-impact";
import type { ProjectAnalysis } from "../validation/project-analysis";
import { applyProjectCommand } from "./apply-project-command";
import type { CommandErrorCode, CommandSuccess } from "./command-results";
import {
  resolveProjectCommandDependencies,
  type ProjectCommandDependencies,
} from "./project-command-dependencies";

export const MAX_PROJECT_COMMANDS = 25;

export type BatchCommandOutcome = Pick<
  CommandSuccess,
  "commandType" | "changed" | "affectedEntityIds"
> & { readonly index: number };

export type BatchCommandSuccess = Omit<CommandSuccess, "commandType"> & {
  readonly commandType: "LAYOUT_CHANGES_APPLIED";
  readonly analysis: ProjectAnalysis;
  readonly outcomes: readonly BatchCommandOutcome[];
};

export type BatchCommandFailure = {
  readonly ok: false;
  readonly commandType: ProjectCommandType | "LAYOUT_CHANGES_APPLIED" | null;
  readonly error: {
    readonly index: number | null;
    readonly commandType: ProjectCommandType | null;
    readonly code: CommandErrorCode;
    readonly message: string;
  };
  readonly analysis?: ProjectAnalysis;
  readonly reasons?: readonly string[];
};

export type ProjectCommandsExecution = {
  readonly project: GymProject;
  readonly result: BatchCommandSuccess | BatchCommandFailure;
};

export type BatchDispatchResult = ProjectCommandsExecution["result"] & {
  readonly revision: number;
};

function invalidBatch(project: GymProject): ProjectCommandsExecution {
  return {
    project,
    result: {
      ok: false,
      commandType: null,
      error: {
        index: null,
        commandType: null,
        code: "INVALID_COMMAND",
        message: `A batch must contain between 1 and ${MAX_PROJECT_COMMANDS} commands.`,
      },
    },
  };
}

/** Fold commands atomically; layout validity is a caller policy, not a command precondition. */
export function applyProjectCommands(
  project: GymProject,
  commands: unknown,
  dependencies: ProjectCommandDependencies = {},
): ProjectCommandsExecution {
  if (!Array.isArray(commands) || commands.length === 0 || commands.length > MAX_PROJECT_COMMANDS) {
    return invalidBatch(project);
  }

  const resolved = resolveProjectCommandDependencies(dependencies);
  const outcomes: BatchCommandOutcome[] = [];
  const affectedEntityIds = new Set<string>();
  let nextProject = project;

  for (let index = 0; index < commands.length; index += 1) {
    const execution = applyProjectCommand(nextProject, commands[index], resolved);
    const result = execution.result;
    if (!result.ok) {
      return {
        project,
        result: {
          ...result,
          error: { ...result.error, index, commandType: result.commandType },
        },
      };
    }
    outcomes.push({
      index,
      commandType: result.commandType,
      changed: result.changed,
      affectedEntityIds: result.affectedEntityIds,
    });
    result.affectedEntityIds.forEach((id) => affectedEntityIds.add(id));
    nextProject = execution.project;
  }

  // Commands can cancel each other, so reference inequality alone is insufficient.
  const changed = JSON.stringify(nextProject) !== JSON.stringify(project);
  if (!changed) nextProject = project;
  try {
    const analysis = resolved.analyzeProject(nextProject);
    return {
      project: nextProject,
      result: {
        ok: true,
        commandType: "LAYOUT_CHANGES_APPLIED",
        changed,
        affectedEntityIds: [...affectedEntityIds],
        issues: analysis.issues,
        access: analysis.access,
        accessImpact: changed
          ? diffAccessImpact(resolved.analyzeProject(project), analysis)
          : EMPTY_ACCESS_IMPACT,
        items: analysis.items,
        coverage: analysis.coverage,
        analysis,
        outcomes,
      },
    };
  } catch {
    return {
      project,
      result: {
        ok: false,
        commandType: "LAYOUT_CHANGES_APPLIED",
        error: {
          index: null,
          commandType: null,
          code: "EXECUTION_FAILED",
          message: "The batch could not be analyzed.",
        },
      },
    };
  }
}
