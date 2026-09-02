import { intersectRectangles, type RectangleBounds } from "@/features/geometry/rectangles";
import type { Obstacle } from "@/features/project/schemas/project";

import type { CollisionIssue, ValidationIssue } from "./validation-issues";
import type { ObstacleWithFootprint, ResolvedPlacement } from "./validation-model";

function getPairIssueCode(
  first: Obstacle,
  second: Obstacle,
): CollisionIssue["code"] | null {
  if (first.kind === "unavailable-zone" && second.kind === "unavailable-zone") {
    return null;
  }

  return first.kind === "obstacle" && second.kind === "obstacle"
    ? "PHYSICAL_COLLISION"
    : "UNAVAILABLE_ZONE_CONFLICT";
}

function collisionIssue(
  code: CollisionIssue["code"],
  firstId: string,
  secondId: string,
  overlap: RectangleBounds,
): CollisionIssue {
  return {
    code,
    severity: "error",
    entityIds: [firstId, secondId].sort() as [string, string],
    details: { overlap },
  };
}

export function validateObstacleCollisions(
  items: readonly ObstacleWithFootprint[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (let firstIndex = 0; firstIndex < items.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < items.length; secondIndex += 1) {
      const first = items[firstIndex];
      const second = items[secondIndex];
      const code = getPairIssueCode(first.obstacle, second.obstacle);

      if (!code) {
        continue;
      }

      const overlap = intersectRectangles(first.footprint, second.footprint);
      if (!overlap) {
        continue;
      }

      issues.push(
        collisionIssue(code, first.obstacle.id, second.obstacle.id, overlap),
      );
    }
  }

  return issues;
}

export function placementPairReaches(
  first: ResolvedPlacement,
  second: ResolvedPlacement,
): boolean {
  if (first.mounting.kind === "wall" && second.mounting.kind === "wall") {
    return true;
  }
  if (first.mounting.kind === "wall") {
    return first.mounting.blocksFloor === true ||
      second.product.dimensions.heightCm > first.mounting.bottomHeightCm;
  }
  if (second.mounting.kind === "wall") {
    return second.mounting.blocksFloor === true ||
      first.product.dimensions.heightCm > second.mounting.bottomHeightCm;
  }
  return true;
}

export function placementReachesObstacle(
  placement: ResolvedPlacement,
  obstacle: ObstacleWithFootprint,
): boolean {
  if (placement.mounting.kind !== "wall" || placement.mounting.blocksFloor === true) {
    return true;
  }
  if (obstacle.obstacle.kind === "unavailable-zone") {
    return true;
  }
  return obstacle.obstacle.dimensions.heightCm > placement.mounting.bottomHeightCm;
}

export function validatePlacementCollisions(
  obstacles: readonly ObstacleWithFootprint[],
  placements: readonly ResolvedPlacement[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (let firstIndex = 0; firstIndex < placements.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < placements.length; secondIndex += 1) {
      const first = placements[firstIndex];
      const second = placements[secondIndex];
      if (!placementPairReaches(first, second)) {
        continue;
      }
      const overlap = intersectRectangles(
        first.footprints.physical,
        second.footprints.physical,
      );
      if (overlap) {
        issues.push(
          collisionIssue(
            "PHYSICAL_COLLISION",
            first.placement.id,
            second.placement.id,
            overlap,
          ),
        );
      }
    }
  }

  for (const placement of placements) {
    for (const obstacle of obstacles) {
      if (!placementReachesObstacle(placement, obstacle)) {
        continue;
      }
      const overlap = intersectRectangles(
        placement.footprints.physical,
        obstacle.footprint,
      );
      if (overlap) {
        issues.push(
          collisionIssue(
            obstacle.obstacle.kind === "obstacle"
              ? "PHYSICAL_COLLISION"
              : "UNAVAILABLE_ZONE_CONFLICT",
            placement.placement.id,
            obstacle.obstacle.id,
            overlap,
          ),
        );
      }
    }
  }

  return issues;
}
