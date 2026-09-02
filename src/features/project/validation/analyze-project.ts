import type { GymProject } from "@/features/project/schemas/project";

import {
  createProjectAnalysis,
  type ProjectAnalysis,
} from "./project-analysis";
import type { ProjectValidationDependencies } from "./product-validation";
import type { ValidationIssue } from "./validation-issues";
import {
  collectObstacles,
  compareIssues,
  resolvePlacements,
  resolveProjectItems,
} from "./validation-model";
import {
  validateObstacleBounds,
  validatePlacementBounds,
} from "./validate-bounds";
import {
  validateObstacleCollisions,
  validatePlacementCollisions,
} from "./validate-collisions";
import { validateMounting } from "./validate-mounting";
import { validatePlacementRequirements, trainingGoalCoverage } from "./validate-requirements";
import { validateUseZones } from "./validate-use-zones";
import { validateFunctionalClearances } from "./validate-functional-clearances";
import { validateWallElements } from "./validate-wall-elements";
import { validateAccess } from "./validate-access";

export type { ProjectAnalysis } from "./project-analysis";
export { createProjectAnalysis } from "./project-analysis";

const PAIR_OVERLAP_CODES = new Set<ValidationIssue["code"]>([
  "PHYSICAL_COLLISION",
  "UNAVAILABLE_ZONE_CONFLICT",
  "USE_ZONE_OVERLAP",
  "FUNCTIONAL_ZONE_OVERLAP",
]);

function overlapStrength(issue: ValidationIssue): number {
  const severity = issue.severity === "error" ? 100 : 0;
  switch (issue.code) {
    case "PHYSICAL_COLLISION":
    case "UNAVAILABLE_ZONE_CONFLICT":
      return severity + 30;
    case "FUNCTIONAL_ZONE_OVERLAP":
      return severity + 20;
    case "USE_ZONE_OVERLAP":
      return severity + 10;
    default:
      return -1;
  }
}

/** Keep only the strongest spatial issue for a pair while preserving unrelated checks. */
function strongestPairIssues(issues: readonly ValidationIssue[]): ValidationIssue[] {
  const selected = new Map<string, ValidationIssue>();
  const unrelated: ValidationIssue[] = [];
  for (const issue of issues) {
    if (issue.entityIds.length !== 2 || !PAIR_OVERLAP_CODES.has(issue.code)) {
      unrelated.push(issue);
      continue;
    }
    const key = issue.entityIds.join("\u0000");
    const current = selected.get(key);
    if (!current || overlapStrength(issue) > overlapStrength(current)) selected.set(key, issue);
  }
  return [...unrelated, ...selected.values()];
}

export function analyzeProject(
  project: GymProject,
  dependencies: ProjectValidationDependencies = {},
): ProjectAnalysis {
  const items = collectObstacles(project);
  const placements = resolvePlacements(project, dependencies);
  const projectItems = resolveProjectItems(project, dependencies);
  const access = validateAccess(project, items, placements);
  const issues = strongestPairIssues([
    ...validateObstacleBounds(project, items),
    ...validatePlacementBounds(project, placements),
    ...validateObstacleCollisions(items),
    ...validatePlacementCollisions(items, placements),
    ...validateUseZones(items, placements),
    ...validateFunctionalClearances(items, placements),
    ...validateMounting(project, placements),
    ...validatePlacementRequirements(project, placements, projectItems),
    ...validateWallElements(project),
    ...access.issues,
  ]).sort(compareIssues);

  return createProjectAnalysis(
    issues,
    access.access,
    projectItems.map(({ item, product, placement }) => ({
      id: item.id,
      productId: item.productId,
      placementId: placement?.id ?? null,
      placed: placement !== undefined,
      placementMode: product.placementMode ?? "floor",
      price: product.price,
    })),
    trainingGoalCoverage(project.trainingGoals, projectItems),
  );
}

export function validateProject(
  project: GymProject,
  dependencies: ProjectValidationDependencies = {},
): readonly ValidationIssue[] {
  return analyzeProject(project, dependencies).issues;
}
