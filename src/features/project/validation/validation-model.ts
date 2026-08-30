import {
  createEquipmentFootprints,
  type EquipmentFootprints,
} from "@/features/geometry/equipment-footprints";
import {
  createRectangleFootprint,
  type RectangleFootprint,
} from "@/features/geometry/rectangles";
import type { GymProject, Obstacle, Placement } from "@/features/project/schemas/project";

import type { ValidationIssue } from "./validation-issues";
import type {
  EffectiveMounting,
  ProductValidationDescriptor,
  ProjectValidationDependencies,
} from "./product-validation";

export type ObstacleWithFootprint = {
  readonly obstacle: Obstacle;
  readonly footprint: RectangleFootprint;
};

export type ResolvedPlacement = {
  readonly placement: Placement;
  readonly product: ProductValidationDescriptor;
  readonly footprints: EquipmentFootprints;
  readonly mounting: EffectiveMounting;
};

export function compareIssues(first: ValidationIssue, second: ValidationIssue): number {
  const firstKey = `${first.entityIds.join("\u0000")}\u0000${first.code}`;
  const secondKey = `${second.entityIds.join("\u0000")}\u0000${second.code}`;
  if (firstKey === secondKey) {
    return 0;
  }
  return firstKey < secondKey ? -1 : 1;
}

export function collectObstacles(project: GymProject): ObstacleWithFootprint[] {
  return project.obstacles.map((obstacle) => ({
    obstacle,
    footprint: createRectangleFootprint(
      obstacle.position,
      obstacle.dimensions,
      obstacle.rotation,
    ),
  }));
}

export function resolvePlacements(
  project: GymProject,
  dependencies: ProjectValidationDependencies,
): ResolvedPlacement[] {
  if (!dependencies.resolveProduct) {
    return [];
  }

  return project.placements.flatMap((placement) => {
    const product = dependencies.resolveProduct?.(placement.productId);
    return product
      ? [{
          placement,
          product,
          footprints: createEquipmentFootprints(placement, product),
          mounting: product.mounting ?? { kind: "floor" },
        }]
      : [];
  });
}
