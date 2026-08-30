import type { GymProject } from "@/features/project/schemas/project";
import type { TrainingGoal } from "@/shared/schemas/training-goal";

import type { ValidationIssue } from "./validation-issues";
import type { ResolvedPlacement, ResolvedProjectItem } from "./validation-model";

export function validatePlacementRequirements(
  project: GymProject,
  placements: readonly ResolvedPlacement[],
  items: readonly ResolvedProjectItem[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  let totalPrice = 0;

  for (const { product } of items) {
    totalPrice += product.price;
  }

  for (const { placement, product, mounting } of placements) {
    const storedRequiredCm = product.minimumCeilingHeightCm ?? product.dimensions.heightCm;
    const mountedTopCm = mounting.kind === "wall"
      ? mounting.bottomHeightCm + product.dimensions.heightCm
      : 0;
    const requiredHeightCm = Math.max(storedRequiredCm, mountedTopCm);
    if (requiredHeightCm > project.room.heightCm) {
      issues.push({
        code: "CEILING_TOO_LOW",
        severity: "error",
        entityIds: [placement.id],
        details: {
          roomHeightCm: project.room.heightCm,
          productHeightCm: product.dimensions.heightCm,
          requiredHeightCm,
          ...(mounting.kind === "wall"
            ? { mountBottomHeightCm: mounting.bottomHeightCm }
            : {}),
        },
      });
    }
  }

  if (totalPrice > project.budget) {
    issues.push({
      code: "BUDGET_EXCEEDED",
      severity: "error",
      entityIds: items.map(({ item }) => item.id).sort(),
      details: {
        budget: project.budget,
        totalPrice,
        excess: totalPrice - project.budget,
      },
    });
  }

  return issues;
}

export function trainingGoalCoverage(
  requested: readonly TrainingGoal[],
  items: readonly ResolvedProjectItem[],
): {
  readonly requested: readonly TrainingGoal[];
  readonly covered: readonly TrainingGoal[];
  readonly uncovered: readonly TrainingGoal[];
} {
  const coveredSet = new Set<TrainingGoal>();
  for (const { product } of items) {
    for (const goal of product.trainingGoals ?? []) {
      if (requested.includes(goal)) coveredSet.add(goal);
    }
  }

  const covered = requested.filter((goal) => coveredSet.has(goal));
  return {
    requested: [...requested],
    covered,
    uncovered: requested.filter((goal) => !coveredSet.has(goal)),
  };
}
