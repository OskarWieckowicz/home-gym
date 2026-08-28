import {
  createRectangleFootprint,
  intersectRectangles,
  type RectangleFootprint,
} from "@/features/geometry/rectangles";
import {
  fitsRoomHeight,
  getOutsideHorizontalAxes,
} from "@/features/geometry/room-bounds";
import type { GymProject, Obstacle } from "@/features/project/schemas/project";

import type {
  CollisionIssue,
  OutsideRoomAxis,
  ValidationIssue,
} from "./validation-issues";

type ObstacleWithFootprint = {
  readonly obstacle: Obstacle;
  readonly footprint: RectangleFootprint;
};

function compareIssues(first: ValidationIssue, second: ValidationIssue): number {
  const firstKey = `${first.entityIds.join("\u0000")}\u0000${first.code}`;
  const secondKey = `${second.entityIds.join("\u0000")}\u0000${second.code}`;
  if (firstKey === secondKey) {
    return 0;
  }
  return firstKey < secondKey ? -1 : 1;
}

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

function createBoundsIssue(
  project: GymProject,
  item: ObstacleWithFootprint,
): ValidationIssue | null {
  const axes: OutsideRoomAxis[] = getOutsideHorizontalAxes(
    item.footprint,
    project.room,
  );

  if (!fitsRoomHeight(item.obstacle.dimensions.heightCm, project.room)) {
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
      entityHeightCm: item.obstacle.dimensions.heightCm,
    },
  };
}

export function validateProject(project: GymProject): ValidationIssue[] {
  const items = project.obstacles.map((obstacle) => ({
    obstacle,
    footprint: createRectangleFootprint(
      obstacle.position,
      obstacle.dimensions,
      obstacle.rotation,
    ),
  }));
  const issues: ValidationIssue[] = [];

  for (const item of items) {
    const boundsIssue = createBoundsIssue(project, item);
    if (boundsIssue) {
      issues.push(boundsIssue);
    }
  }

  for (let firstIndex = 0; firstIndex < items.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < items.length;
      secondIndex += 1
    ) {
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

      const entityIds = [first.obstacle.id, second.obstacle.id].sort() as [
        string,
        string,
      ];
      issues.push({
        code,
        severity: "error",
        entityIds,
        details: { overlap },
      });
    }
  }

  return issues.sort(compareIssues);
}
