import { intersectRectangles, type RectangleBounds } from "@/features/geometry/rectangles";

import type { UseZoneOverlapIssue, ValidationIssue } from "./validation-issues";
import type { ObstacleWithFootprint, ResolvedPlacement } from "./validation-model";

function createUseZoneOverlapIssue(
  useZonePlacementId: string,
  blockingEntityId: string,
  overlap: RectangleBounds,
  severity: UseZoneOverlapIssue["severity"],
): UseZoneOverlapIssue {
  return {
    code: "USE_ZONE_OVERLAP",
    severity,
    entityIds: [useZonePlacementId, blockingEntityId].sort() as [string, string],
    details: { overlap, useZonePlacementId, blockingEntityId },
  };
}

function placementPairUseZoneIssue(
  first: ResolvedPlacement,
  second: ResolvedPlacement,
): UseZoneOverlapIssue | null {
  if (intersectRectangles(first.footprints.physical, second.footprints.physical)) {
    return null;
  }

  const firstOverlap = intersectRectangles(
    first.footprints.useZone,
    second.footprints.physical,
  );
  const secondOverlap = intersectRectangles(
    second.footprints.useZone,
    first.footprints.physical,
  );
  const overlap = firstOverlap ?? secondOverlap;
  if (overlap) {
    const owner = firstOverlap ? first : second;
    const blocker = firstOverlap ? second : first;
    return createUseZoneOverlapIssue(
      owner.placement.id,
      blocker.placement.id,
      overlap,
      "warning",
    );
  }

  const zoneOverlap = intersectRectangles(
    first.footprints.useZone,
    second.footprints.useZone,
  );
  if (!zoneOverlap) {
    return null;
  }

  return createUseZoneOverlapIssue(
    first.placement.id,
    second.placement.id,
    zoneOverlap,
    "warning",
  );
}

export function validateUseZones(
  obstacles: readonly ObstacleWithFootprint[],
  placements: readonly ResolvedPlacement[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const sortedPlacements = [...placements].sort((a, b) =>
    a.placement.id < b.placement.id ? -1 : a.placement.id > b.placement.id ? 1 : 0,
  );

  for (let firstIndex = 0; firstIndex < sortedPlacements.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < sortedPlacements.length;
      secondIndex += 1
    ) {
      const issue = placementPairUseZoneIssue(
        sortedPlacements[firstIndex],
        sortedPlacements[secondIndex],
      );
      if (issue) {
        issues.push(issue);
      }
    }
  }

  for (const placement of sortedPlacements) {
    for (const obstacle of obstacles) {
      if (intersectRectangles(placement.footprints.physical, obstacle.footprint)) {
        continue;
      }
      const overlap = intersectRectangles(
        placement.footprints.useZone,
        obstacle.footprint,
      );
      if (overlap) {
        issues.push(
          createUseZoneOverlapIssue(
            placement.placement.id,
            obstacle.obstacle.id,
            overlap,
            "error",
          ),
        );
      }
    }
  }

  return issues;
}
