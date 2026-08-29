import type { GymProject, Wall } from "@/features/project/schemas/project";

import type { ValidationIssue } from "./validation-issues";

function getWallLength(project: GymProject, wall: Wall): number {
  return wall === "top" || wall === "bottom"
    ? project.room.widthCm
    : project.room.depthCm;
}

export function validateWallElements(project: GymProject): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const wallElement of project.wallElements) {
    const wallLengthCm = getWallLength(project, wallElement.wall);
    if (wallElement.offsetCm + wallElement.widthCm > wallLengthCm) {
      issues.push({
        code: "OUTSIDE_WALL",
        severity: "error",
        entityIds: [wallElement.id],
        details: {
          wall: wallElement.wall,
          wallLengthCm,
          offsetCm: wallElement.offsetCm,
          widthCm: wallElement.widthCm,
        },
      });
    }
  }

  for (let firstIndex = 0; firstIndex < project.wallElements.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < project.wallElements.length;
      secondIndex += 1
    ) {
      const first = project.wallElements[firstIndex];
      const second = project.wallElements[secondIndex];
      if (first.wall !== second.wall) {
        continue;
      }

      const startCm = Math.max(first.offsetCm, second.offsetCm);
      const endCm = Math.min(
        first.offsetCm + first.widthCm,
        second.offsetCm + second.widthCm,
      );
      if (startCm >= endCm) {
        continue;
      }

      const entityIds = [first.id, second.id].sort() as [string, string];
      issues.push({
        code: "WALL_ELEMENT_OVERLAP",
        severity: "error",
        entityIds,
        details: { wall: first.wall, overlap: { startCm, endCm } },
      });
    }
  }

  return issues;
}
