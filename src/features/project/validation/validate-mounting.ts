import {
  getMountedWall,
  getWallMountFlushGap,
  getWallMountSpan,
} from "@/features/geometry/wall-mounting";
import type { GymProject } from "@/features/project/schemas/project";

import type { ValidationIssue } from "./validation-issues";
import type { ResolvedPlacement } from "./validation-model";

export function validateMounting(
  project: GymProject,
  placements: readonly ResolvedPlacement[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const resolved of placements) {
    if (resolved.mounting.kind !== "wall") {
      continue;
    }

    const wall = getMountedWall(resolved.placement.rotation);
    const gapCm = getWallMountFlushGap(resolved.footprints.physical, project.room, wall);
    if (gapCm !== 0) {
      issues.push({
        code: "WALL_MOUNT_OFF_WALL",
        severity: "error",
        entityIds: [resolved.placement.id],
        details: { wall, gapCm },
      });
    }

    const span = getWallMountSpan(resolved.footprints.physical, wall);
    for (const element of project.wallElements) {
      if (element.wall !== wall) {
        continue;
      }
      const startCm = Math.max(span.startCm, element.offsetCm);
      const endCm = Math.min(span.endCm, element.offsetCm + element.widthCm);
      if (startCm >= endCm) {
        continue;
      }
      issues.push({
        code: "WALL_MOUNT_OVERLAPS_OPENING",
        severity: "error",
        entityIds: [resolved.placement.id, element.id].sort() as [string, string],
        details: { wall, overlap: { startCm, endCm } },
      });
    }
  }

  return issues;
}
