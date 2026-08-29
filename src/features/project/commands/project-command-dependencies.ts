import { validateProject } from "../validation/validate-project";
import type { ValidationIssue } from "../validation/validation-issues";
import type { ProductResolver } from "../validation/product-validation";
import type { GymProject } from "../schemas/project";

export type ProjectCommandDependencies = {
  readonly generateObstacleId?: () => string;
  readonly generateWallElementId?: () => string;
  readonly generatePlacementId?: () => string;
  readonly resolveProduct?: ProductResolver;
  readonly validateProject?: (project: GymProject) => ValidationIssue[];
};

export type ResolvedProjectCommandDependencies = Required<
  ProjectCommandDependencies
>;

const missingProductResolver: ProductResolver = () => undefined;

export const defaultProjectCommandDependencies: ResolvedProjectCommandDependencies = {
  generateObstacleId: () => `obstacle_${globalThis.crypto.randomUUID()}`,
  generateWallElementId: () => `wall-element_${globalThis.crypto.randomUUID()}`,
  generatePlacementId: () => `placement_${globalThis.crypto.randomUUID()}`,
  resolveProduct: missingProductResolver,
  validateProject: (project) => validateProject(project),
};

export function resolveProjectCommandDependencies(
  dependencies: ProjectCommandDependencies = {},
): ResolvedProjectCommandDependencies {
  const resolveProduct =
    dependencies.resolveProduct ?? defaultProjectCommandDependencies.resolveProduct;

  return {
    ...defaultProjectCommandDependencies,
    ...dependencies,
    resolveProduct,
    validateProject:
      dependencies.validateProject ??
      ((project) => validateProject(project, { resolveProduct })),
  };
}

