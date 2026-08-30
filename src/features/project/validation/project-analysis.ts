import type { ProjectAccess } from "@/features/geometry/access-facts";
import { UNEVALUATED_ACCESS } from "@/features/geometry/access-facts";
import type { PlacementMode } from "@/shared/schemas/placement-mode";
import type { TrainingGoal } from "@/shared/schemas/training-goal";

import type { ValidationIssue } from "./validation-issues";

export type AnalyzedProjectItem = {
  readonly id: string;
  readonly productId: string;
  readonly placementId: string | null;
  readonly placed: boolean;
  readonly placementMode: PlacementMode;
  readonly price: number;
};

export type TrainingGoalCoverage = {
  readonly requested: readonly TrainingGoal[];
  readonly covered: readonly TrainingGoal[];
  readonly uncovered: readonly TrainingGoal[];
};

export const EMPTY_TRAINING_GOAL_COVERAGE: TrainingGoalCoverage = {
  requested: [],
  covered: [],
  uncovered: [],
};

export type ProjectAnalysis = {
  readonly issues: readonly ValidationIssue[];
  readonly valid: boolean;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly access: ProjectAccess;
  readonly items: readonly AnalyzedProjectItem[];
  readonly coverage: TrainingGoalCoverage;
};

export function createProjectAnalysis(
  issues: readonly ValidationIssue[],
  access: ProjectAccess = UNEVALUATED_ACCESS,
  items: readonly AnalyzedProjectItem[] = [],
  coverage: TrainingGoalCoverage = EMPTY_TRAINING_GOAL_COVERAGE,
): ProjectAnalysis {
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  return {
    issues,
    valid: errorCount === 0,
    errorCount,
    warningCount,
    access,
    items,
    coverage,
  };
}
