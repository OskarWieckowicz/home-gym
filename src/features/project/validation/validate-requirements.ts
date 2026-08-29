import type { GymProject } from "@/features/project/schemas/project";

import type { ValidationIssue } from "./validation-issues";
import type { ResolvedPlacement } from "./validation-model";

export function validatePlacementRequirements(
  project: GymProject,
  placements: readonly ResolvedPlacement[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  let totalPrice = 0;

  for (const { placement, product } of placements) {
    totalPrice += product.price;
    const requiredHeightCm = product.minimumCeilingHeightCm ?? product.dimensions.heightCm;
    if (requiredHeightCm > project.room.heightCm) {
      issues.push({
        code: "CEILING_TOO_LOW",
        severity: "error",
        entityIds: [placement.id],
        details: {
          roomHeightCm: project.room.heightCm,
          productHeightCm: product.dimensions.heightCm,
          requiredHeightCm,
        },
      });
    }
  }

  if (totalPrice > project.budget) {
    issues.push({
      code: "BUDGET_EXCEEDED",
      severity: "error",
      entityIds: placements.map(({ placement }) => placement.id).sort(),
      details: {
        budget: project.budget,
        totalPrice,
        excess: totalPrice - project.budget,
      },
    });
  }

  return issues;
}
