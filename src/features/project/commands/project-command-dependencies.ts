import { analyzeProject } from "../validation/analyze-project";
import type { ProjectAnalysis } from "../validation/project-analysis";
import type { ProductResolver } from "../validation/product-validation";
import type { GymProject } from "../schemas/project";

export type ProjectCommandDependencies = {
  readonly generateObstacleId?: () => string;
  readonly generateWallElementId?: () => string;
  readonly generatePlacementId?: () => string;
  readonly resolveProduct?: ProductResolver;
  readonly analyzeProject?: (project: GymProject) => ProjectAnalysis;
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
  analyzeProject: (project) => analyzeProject(project),
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
    analyzeProject:
      dependencies.analyzeProject ??
      ((project) => analyzeProject(project, { resolveProduct })),
  };
}
