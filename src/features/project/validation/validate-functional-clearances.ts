import { getUseZoneMarginRectangles } from "@/features/geometry/equipment-footprints";
import { intersectRectangles, type RectangleBounds } from "@/features/geometry/rectangles";

import type { FunctionalZoneOverlapIssue, ValidationIssue } from "./validation-issues";
import type { ObstacleWithFootprint, ResolvedPlacement } from "./validation-model";
import { placementReachesObstacle } from "./validate-collisions";

function createIssue(
  zoneOwnerId: string,
  blockingEntityId: string,
  overlap: RectangleBounds,
  severity: FunctionalZoneOverlapIssue["severity"],
): FunctionalZoneOverlapIssue {
  return {
    code: "FUNCTIONAL_ZONE_OVERLAP",
    severity,
    entityIds: [zoneOwnerId, blockingEntityId].sort() as [string, string],
    details: { zoneOwnerId, blockingEntityId, overlap },
  };
}

function firstIntersection(
  first: readonly RectangleBounds[],
  second: readonly RectangleBounds[],
): RectangleBounds | null {
  for (const firstBounds of first) {
    for (const secondBounds of second) {
      const overlap = intersectRectangles(firstBounds, secondBounds);
      if (overlap) return overlap;
    }
  }
  return null;
}

function functionalMargins(obstacle: ObstacleWithFootprint): readonly RectangleBounds[] {
  if (!obstacle.hasFunctionalClearance) return [];
  return getUseZoneMarginRectangles(obstacle.functionalFootprint, obstacle.footprint);
}

function obstaclePairIssue(
  first: ObstacleWithFootprint,
  second: ObstacleWithFootprint,
): FunctionalZoneOverlapIssue | null {
  if (first.obstacle.kind !== "obstacle" || second.obstacle.kind !== "obstacle") return null;
  if (intersectRectangles(first.footprint, second.footprint)) return null;

  const firstOverlap = firstIntersection(functionalMargins(first), [second.footprint]);
  if (firstOverlap) {
    return createIssue(first.obstacle.id, second.obstacle.id, firstOverlap, "warning");
  }
  const secondOverlap = firstIntersection(functionalMargins(second), [first.footprint]);
  return secondOverlap
    ? createIssue(second.obstacle.id, first.obstacle.id, secondOverlap, "warning")
    : null;
}

function placementObstacleIssue(
  placement: ResolvedPlacement,
  obstacle: ObstacleWithFootprint,
): FunctionalZoneOverlapIssue | null {
  if (obstacle.obstacle.kind !== "obstacle" || !obstacle.hasFunctionalClearance) return null;
  const physicalOverlap = intersectRectangles(placement.footprints.physical, obstacle.footprint);
  if (physicalOverlap && placementReachesObstacle(placement, obstacle)) return null;

  const margins = functionalMargins(obstacle);
  const equipmentOverlap = firstIntersection([placement.footprints.physical], margins);
  if (equipmentOverlap) {
    return createIssue(obstacle.obstacle.id, placement.placement.id, equipmentOverlap, "error");
  }

  const useZoneOverlap = firstIntersection(
    getUseZoneMarginRectangles(placement.footprints.useZone, placement.footprints.physical),
    margins,
  );
  return useZoneOverlap
    ? createIssue(obstacle.obstacle.id, placement.placement.id, useZoneOverlap, "warning")
    : null;
}

export function validateFunctionalClearances(
  obstacles: readonly ObstacleWithFootprint[],
  placements: readonly ResolvedPlacement[],
): ValidationIssue[] {
  const physicalObstacles = obstacles
    .filter((item) => item.obstacle.kind === "obstacle")
    .sort((first, second) => first.obstacle.id < second.obstacle.id ? -1 : first.obstacle.id > second.obstacle.id ? 1 : 0);
  const sortedPlacements = [...placements]
    .sort((first, second) => first.placement.id < second.placement.id ? -1 : first.placement.id > second.placement.id ? 1 : 0);
  const issues: ValidationIssue[] = [];

  for (let firstIndex = 0; firstIndex < physicalObstacles.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < physicalObstacles.length; secondIndex += 1) {
      const issue = obstaclePairIssue(
        physicalObstacles[firstIndex],
        physicalObstacles[secondIndex],
      );
      if (issue) issues.push(issue);
    }
  }

  for (const placement of sortedPlacements) {
    for (const obstacle of physicalObstacles) {
      const issue = placementObstacleIssue(placement, obstacle);
      if (issue) issues.push(issue);
    }
  }
  return issues;
}
