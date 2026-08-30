import {
  createEquipmentFootprints,
  type EquipmentFootprints,
} from "@/features/geometry/equipment-footprints";
import {
  createRectangleFootprint,
  type RectangleFootprint,
} from "@/features/geometry/rectangles";
import type { GymProject, Obstacle, Placement, ProjectItem } from "@/features/project/schemas/project";

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

  const itemsById = new Map(project.projectItems.map((item) => [item.id, item] as const));

  return project.placements.flatMap((placement) => {
    const item = itemsById.get(placement.projectItemId);
    const product = item ? dependencies.resolveProduct?.(item.productId) : undefined;
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

export type ResolvedProjectItem = {
  readonly item: ProjectItem;
  readonly product: ProductValidationDescriptor;
  readonly placement: Placement | undefined;
};

export function resolveProjectItems(
  project: GymProject,
  dependencies: ProjectValidationDependencies,
): ResolvedProjectItem[] {
  if (!dependencies.resolveProduct) {
    return [];
  }

  const placementByItemId = new Map(
    project.placements.map((placement) => [placement.projectItemId, placement] as const),
  );

  return project.projectItems.flatMap((item) => {
    const product = dependencies.resolveProduct?.(item.productId);
    return product
      ? [{ item, product, placement: placementByItemId.get(item.id) }]
      : [];
  });
}
