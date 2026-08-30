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
import { validateWallElements } from "./validate-wall-elements";
import { validateAccess } from "./validate-access";

export type { ProjectAnalysis } from "./project-analysis";
export { createProjectAnalysis } from "./project-analysis";

export function analyzeProject(
  project: GymProject,
  dependencies: ProjectValidationDependencies = {},
): ProjectAnalysis {
  const items = collectObstacles(project);
  const placements = resolvePlacements(project, dependencies);
  const projectItems = resolveProjectItems(project, dependencies);
  const access = validateAccess(project, items, placements);
  const issues = [
    ...validateObstacleBounds(project, items),
    ...validatePlacementBounds(project, placements),
    ...validateObstacleCollisions(items),
    ...validatePlacementCollisions(items, placements),
    ...validateUseZones(items, placements),
    ...validateMounting(project, placements),
    ...validatePlacementRequirements(project, placements, projectItems),
    ...validateWallElements(project),
    ...access.issues,
  ].sort(compareIssues);

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
