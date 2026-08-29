import type { ValidationIssue } from "./validation-issues";

export type ProjectAnalysis = {
  readonly issues: readonly ValidationIssue[];
  readonly valid: boolean;
  readonly errorCount: number;
  readonly warningCount: number;
};

export function createProjectAnalysis(
  issues: readonly ValidationIssue[],
): ProjectAnalysis {
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  return {
    issues,
    valid: errorCount === 0,
    errorCount,
    warningCount,
  };
}
