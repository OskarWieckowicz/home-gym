import type { Wall } from "@/features/project/schemas/project";

import { rectanglesOverlap, type RectangleBounds } from "./rectangles";
import { getWallMountFlushGap } from "./wall-mounting";

export type DistanceObstacle = {
  readonly id: string;
  readonly name: string;
  readonly bounds: RectangleBounds;
};

export type NearestObstacleDistance = {
  readonly id: string;
  readonly name: string;
  readonly distanceCm: number;
  readonly status: "separated" | "touching" | "overlapping";
};

export type SelectionDistances = {
  readonly wallsCm: Readonly<Record<Wall, number>>;
  readonly nearestObstacle: NearestObstacleDistance | null;
};

function measureObstacle(
  footprint: RectangleBounds,
  obstacle: DistanceObstacle,
): NearestObstacleDistance {
  const gapX = Math.max(
    0,
    obstacle.bounds.minX - footprint.maxX,
    footprint.minX - obstacle.bounds.maxX,
  );
  const gapZ = Math.max(
    0,
    obstacle.bounds.minZ - footprint.maxZ,
    footprint.minZ - obstacle.bounds.maxZ,
  );
  const distanceCm = Math.hypot(gapX, gapZ);
  let status: NearestObstacleDistance["status"] = "separated";
  if (rectanglesOverlap(footprint, obstacle.bounds)) status = "overlapping";
  else if (distanceCm === 0) status = "touching";

  return { id: obstacle.id, name: obstacle.name, distanceCm, status };
}

/**
 * Distances between projected physical floor footprints, not safety zones or
 * three-dimensional clearance. Callers pass physical obstacles only; unavailable
 * zones are not physical obstacles. Wall gaps remain negative outside the room.
 */
export function measureSelectionDistances(
  footprint: RectangleBounds,
  room: { readonly widthCm: number; readonly depthCm: number },
  physicalObstacles: readonly DistanceObstacle[],
): SelectionDistances {
  let nearestObstacle: NearestObstacleDistance | null = null;
  for (const obstacle of physicalObstacles) {
    const candidate = measureObstacle(footprint, obstacle);
    if (
      nearestObstacle === null ||
      candidate.distanceCm < nearestObstacle.distanceCm ||
      (candidate.distanceCm === nearestObstacle.distanceCm &&
        candidate.id < nearestObstacle.id)
    ) {
      nearestObstacle = candidate;
    }
  }

  return {
    wallsCm: {
      top: getWallMountFlushGap(footprint, room, "top"),
      right: getWallMountFlushGap(footprint, room, "right"),
      bottom: getWallMountFlushGap(footprint, room, "bottom"),
      left: getWallMountFlushGap(footprint, room, "left"),
    },
    nearestObstacle,
  };
}
