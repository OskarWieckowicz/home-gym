import type { ProjectCommandType } from "../schemas/project-command";
import type { ProjectAccess } from "@/features/geometry/access-facts";
import type { AccessImpact } from "../validation/access-impact";
import type { ProjectAnalysis } from "../validation/project-analysis";
import type { ValidationIssue } from "../validation/validation-issues";

export const COMMAND_ERROR_CODES = [
  "INVALID_COMMAND",
  "ENTITY_NOT_FOUND",
  "ENTITY_LOCKED",
  "ID_CONFLICT",
  "EXECUTION_FAILED",
] as const;

export type CommandErrorCode = (typeof COMMAND_ERROR_CODES)[number];

export type CommandSuccess = {
  readonly ok: true;
  readonly commandType: ProjectCommandType;
  readonly changed: boolean;
  readonly affectedEntityIds: readonly string[];
  readonly issues: readonly ValidationIssue[];
  readonly access: ProjectAccess;
  readonly accessImpact: AccessImpact;
  readonly items: ProjectAnalysis["items"];
  readonly coverage: ProjectAnalysis["coverage"];
};

export type CommandFailure = {
  readonly ok: false;
  readonly commandType: ProjectCommandType | null;
  readonly error: {
    readonly code: CommandErrorCode;
    readonly message: string;
  };
};

export type ProjectCommandResult = CommandSuccess | CommandFailure;

export type DispatchResult = ProjectCommandResult & {
  readonly revision: number;
};
