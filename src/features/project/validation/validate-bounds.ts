import {
  fitsRoomHeight,
  getOutsideHorizontalAxes,
} from "@/features/geometry/room-bounds";
import type { GymProject } from "@/features/project/schemas/project";

import type { OutsideRoomAxis, ValidationIssue } from "./validation-issues";
import type { ObstacleWithFootprint, ResolvedPlacement } from "./validation-model";

function createObstacleBoundsIssue(
  project: GymProject,
  item: ObstacleWithFootprint,
): ValidationIssue | null {
  const axes: OutsideRoomAxis[] = getOutsideHorizontalAxes(
    item.footprint,
    project.room,
  );

  if (
    item.obstacle.kind === "obstacle" &&
    !fitsRoomHeight(item.obstacle.dimensions.heightCm, project.room)
  ) {
    axes.push("height");
  }

  if (axes.length === 0) {
    return null;
  }

  return {
    code: "OUTSIDE_ROOM",
    severity: "error",
    entityIds: [item.obstacle.id],
    details: {
      axes,
      footprint: {
        minX: item.footprint.minX,
        minZ: item.footprint.minZ,
        maxX: item.footprint.maxX,
        maxZ: item.footprint.maxZ,
      },
      room: { ...project.room },
      ...(item.obstacle.kind === "obstacle"
        ? { entityHeightCm: item.obstacle.dimensions.heightCm }
        : {}),
    },
  };
}

export function validateObstacleBounds(
  project: GymProject,
  items: readonly ObstacleWithFootprint[],
): ValidationIssue[] {
  return items.flatMap((item) => {
    const issue = createObstacleBoundsIssue(project, item);
    return issue ? [issue] : [];
  });
}

export function validatePlacementBounds(
  project: GymProject,
  placements: readonly ResolvedPlacement[],
): ValidationIssue[] {
  return placements.flatMap(({ placement, footprints }) => {
    const issues: ValidationIssue[] = [];
    const physicalAxes = getOutsideHorizontalAxes(footprints.physical, project.room);
    if (physicalAxes.length > 0) {
      issues.push({
        code: "OUTSIDE_ROOM",
        severity: "error",
        entityIds: [placement.id],
        details: {
          axes: physicalAxes,
          footprint: footprints.physical,
          room: { ...project.room },
        },
      });
    }

    const useZoneAxes = getOutsideHorizontalAxes(footprints.useZone, project.room);
    if (useZoneAxes.length > 0) {
      issues.push({
        code: "USE_ZONE_OUTSIDE_ROOM",
        severity: "error",
        entityIds: [placement.id],
        details: {
          axes: useZoneAxes,
          footprint: footprints.useZone,
          room: { ...project.room },
        },
      });
    }
    return issues;
  });
}
