import type { ProjectAccess } from "@/features/geometry/access-facts";
import { UNEVALUATED_ACCESS } from "@/features/geometry/access-facts";

import type { ValidationIssue } from "./validation-issues";

export type ProjectAnalysis = {
  readonly issues: readonly ValidationIssue[];
  readonly valid: boolean;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly access: ProjectAccess;
};

export function createProjectAnalysis(
  issues: readonly ValidationIssue[],
  access: ProjectAccess = UNEVALUATED_ACCESS,
): ProjectAnalysis {
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  return {
    issues,
    valid: errorCount === 0,
    errorCount,
    warningCount,
    access,
  };
}
