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
} from "./validation-model";
import {
  validateObstacleBounds,
  validatePlacementBounds,
} from "./validate-bounds";
import {
  validateObstacleCollisions,
  validatePlacementCollisions,
} from "./validate-collisions";
import { validatePlacementRequirements } from "./validate-requirements";
import { validateUseZones } from "./validate-use-zones";
import { validateWallElements } from "./validate-wall-elements";

export type { ProjectAnalysis } from "./project-analysis";
export { createProjectAnalysis } from "./project-analysis";

export function analyzeProject(
  project: GymProject,
  dependencies: ProjectValidationDependencies = {},
): ProjectAnalysis {
  const items = collectObstacles(project);
  const placements = resolvePlacements(project, dependencies);
  const issues = [
    ...validateObstacleBounds(project, items),
    ...validatePlacementBounds(project, placements),
    ...validateObstacleCollisions(items),
    ...validatePlacementCollisions(items, placements),
    ...validateUseZones(items, placements),
    ...validatePlacementRequirements(project, placements),
    ...validateWallElements(project),
  ].sort(compareIssues);

  return createProjectAnalysis(issues);
}

export function validateProject(
  project: GymProject,
  dependencies: ProjectValidationDependencies = {},
): readonly ValidationIssue[] {
  return analyzeProject(project, dependencies).issues;
}
