import { intersectRectangles, type RectangleBounds } from "@/features/geometry/rectangles";
import { getUseZoneMarginRectangles } from "@/features/geometry/equipment-footprints";

import type { UseZoneOverlapIssue, ValidationIssue } from "./validation-issues";
import type { ObstacleWithFootprint, ResolvedPlacement } from "./validation-model";
import {
  placementPairReaches,
  placementReachesObstacle,
} from "./validate-collisions";

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

function firstMarginOverlap(
  placement: ResolvedPlacement,
  blocker: RectangleBounds,
): RectangleBounds | null {
  return getUseZoneMarginRectangles(
    placement.footprints.useZone,
    placement.footprints.physical,
  ).map((margin) => intersectRectangles(margin, blocker))
    .find((candidate): candidate is RectangleBounds => candidate !== null) ?? null;
}

function placementPairUseZoneIssue(
  first: ResolvedPlacement,
  second: ResolvedPlacement,
): UseZoneOverlapIssue | null {
  const physicalOverlap = intersectRectangles(
    first.footprints.physical,
    second.footprints.physical,
  );
  if (physicalOverlap) {
    if (placementPairReaches(first, second)) return null;
    const overheadMount = first.mounting.kind === "wall" ? first : second;
    const blocker = overheadMount === first ? second : first;
    const overlap = firstMarginOverlap(overheadMount, blocker.footprints.physical);
    return overlap
      ? createUseZoneOverlapIssue(
          overheadMount.placement.id,
          blocker.placement.id,
          overlap,
          "warning",
        )
      : null;
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

function obstacleUseZoneIssue(
  placement: ResolvedPlacement,
  obstacle: ObstacleWithFootprint,
): UseZoneOverlapIssue | null {
  const physicalOverlap = intersectRectangles(
    placement.footprints.physical,
    obstacle.footprint,
  );
  if (physicalOverlap && placementReachesObstacle(placement, obstacle)) return null;
  const overlap = physicalOverlap
    ? firstMarginOverlap(placement, obstacle.footprint)
    : intersectRectangles(placement.footprints.useZone, obstacle.footprint);
  return overlap
    ? createUseZoneOverlapIssue(
        placement.placement.id,
        obstacle.obstacle.id,
        overlap,
        "error",
      )
    : null;
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
      const issue = obstacleUseZoneIssue(placement, obstacle);
      if (issue) issues.push(issue);
    }
  }

  return issues;
}
