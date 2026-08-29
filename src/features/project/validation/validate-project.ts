import {
  createEquipmentFootprints,
  type EquipmentFootprints,
} from "@/features/geometry/equipment-footprints";
import {
  createRectangleFootprint,
  intersectRectangles,
  type RectangleBounds,
  type RectangleFootprint,
} from "@/features/geometry/rectangles";
import {
  fitsRoomHeight,
  getOutsideHorizontalAxes,
} from "@/features/geometry/room-bounds";
import type {
  GymProject,
  Obstacle,
  Placement,
  Wall,
} from "@/features/project/schemas/project";

import type {
  CollisionIssue,
  OutsideRoomAxis,
  ValidationIssue,
} from "./validation-issues";
import type {
  ProductValidationDescriptor,
  ProjectValidationDependencies,
} from "./product-validation";

type ObstacleWithFootprint = {
  readonly obstacle: Obstacle;
  readonly footprint: RectangleFootprint;
};

type ResolvedPlacement = {
  readonly placement: Placement;
  readonly product: ProductValidationDescriptor;
  readonly footprints: EquipmentFootprints;
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

export function validateProject(
  project: GymProject,
  dependencies: ProjectValidationDependencies = {},
): ValidationIssue[] {
  const items = project.obstacles.map((obstacle) => ({
    obstacle,
    footprint: createRectangleFootprint(
      obstacle.position,
      obstacle.dimensions,
      obstacle.rotation,
    ),
  }));
  const issues: ValidationIssue[] = [];
  const placements = resolvePlacements(project, dependencies);

  for (const item of items) {
    const boundsIssue = createBoundsIssue(project, item);
    if (boundsIssue) {
      issues.push(boundsIssue);
    }
  }

  issues.push(...validatePlacementBounds(project, placements));

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
  issues.push(...validatePlacementCollisions(items, placements));
  issues.push(...validatePlacementClearance(items, placements));
  issues.push(...validatePlacementRequirements(project, placements));
  issues.push(...validateWallElements(project));

  return issues.sort(compareIssues);
}

function resolvePlacements(
  project: GymProject,
  dependencies: ProjectValidationDependencies,
): ResolvedPlacement[] {
  if (!dependencies.resolveProduct) {
    return [];
  }

  return project.placements.flatMap((placement) => {
    const product = dependencies.resolveProduct?.(placement.productId);
    return product
      ? [{ placement, product, footprints: createEquipmentFootprints(placement, product) }]
      : [];
  });
}

function validatePlacementBounds(
  project: GymProject,
  placements: readonly ResolvedPlacement[],
): ValidationIssue[] {
  return placements.flatMap(({ placement, footprints }) => {
    const issues: ValidationIssue[] = [];
    const physicalAxes = getOutsideHorizontalAxes(footprints.physical, project.room);
    if (physicalAxes.length > 0) {
      issues.push({
          code: "OUTSIDE_ROOM" as const,
          severity: "error" as const,
          entityIds: [placement.id] as const,
          details: {
            axes: physicalAxes,
            footprint: footprints.physical,
            room: { ...project.room },
          },
        });
    }

    const clearanceAxes = getOutsideHorizontalAxes(
      footprints.clearance,
      project.room,
    );
    if (clearanceAxes.length > 0) {
      issues.push({
        code: "CLEARANCE_OUTSIDE_ROOM",
        severity: "error",
        entityIds: [placement.id],
        details: {
          axes: clearanceAxes,
          footprint: footprints.clearance,
          room: { ...project.room },
        },
      });
    }
    return issues;
  });
}

function validatePlacementCollisions(
  obstacles: readonly ObstacleWithFootprint[],
  placements: readonly ResolvedPlacement[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (let firstIndex = 0; firstIndex < placements.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < placements.length; secondIndex += 1) {
      const first = placements[firstIndex];
      const second = placements[secondIndex];
      const overlap = intersectRectangles(first.footprints.physical, second.footprints.physical);
      if (overlap) {
        issues.push(collisionIssue("PHYSICAL_COLLISION", first.placement.id, second.placement.id, overlap));
      }
    }
  }

  for (const placement of placements) {
    for (const obstacle of obstacles) {
      const overlap = intersectRectangles(placement.footprints.physical, obstacle.footprint);
      if (overlap) {
        issues.push(collisionIssue(
          obstacle.obstacle.kind === "obstacle" ? "PHYSICAL_COLLISION" : "UNAVAILABLE_ZONE_CONFLICT",
          placement.placement.id,
          obstacle.obstacle.id,
          overlap,
        ));
      }
    }
  }
  return issues;
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

function validatePlacementClearance(
  obstacles: readonly ObstacleWithFootprint[],
  placements: readonly ResolvedPlacement[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const sortedPlacements = [...placements].sort((a, b) =>
    a.placement.id < b.placement.id ? -1 : a.placement.id > b.placement.id ? 1 : 0,
  );

  for (let firstIndex = 0; firstIndex < sortedPlacements.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < sortedPlacements.length; secondIndex += 1) {
      const first = sortedPlacements[firstIndex];
      const second = sortedPlacements[secondIndex];
      if (intersectRectangles(first.footprints.physical, second.footprints.physical)) {
        continue;
      }
      const firstOverlap = intersectRectangles(first.footprints.clearance, second.footprints.physical);
      const secondOverlap = intersectRectangles(second.footprints.clearance, first.footprints.physical);
      const clearanceOwner = firstOverlap ? first : second;
      const blocker = firstOverlap ? second : first;
      const overlap = firstOverlap ?? secondOverlap;
      if (overlap) {
        issues.push(clearanceIssue(clearanceOwner.placement.id, blocker.placement.id, overlap));
      }
    }
  }

  for (const placement of sortedPlacements) {
    for (const obstacle of obstacles) {
      if (intersectRectangles(placement.footprints.physical, obstacle.footprint)) {
        continue;
      }
      const overlap = intersectRectangles(placement.footprints.clearance, obstacle.footprint);
      if (overlap) {
        issues.push(clearanceIssue(placement.placement.id, obstacle.obstacle.id, overlap));
      }
    }
  }
  return issues;
}

function clearanceIssue(
  clearancePlacementId: string,
  blockingEntityId: string,
  overlap: RectangleBounds,
): ValidationIssue {
  return {
    code: "CLEARANCE_CONFLICT",
    severity: "error",
    entityIds: [clearancePlacementId, blockingEntityId].sort() as [string, string],
    details: { overlap, clearancePlacementId, blockingEntityId },
  };
}

function validatePlacementRequirements(
  project: GymProject,
  placements: readonly ResolvedPlacement[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  let totalPrice = 0;

  for (const { placement, product } of placements) {
    totalPrice += product.price;
    const requiredHeightCm = product.minimumCeilingHeightCm ?? product.dimensions.heightCm;
    if (requiredHeightCm > project.room.heightCm) {
      issues.push({
        code: "CEILING_TOO_LOW",
        severity: "error",
        entityIds: [placement.id],
        details: {
          roomHeightCm: project.room.heightCm,
          productHeightCm: product.dimensions.heightCm,
          requiredHeightCm,
        },
      });
    }
  }

  if (totalPrice > project.budget) {
    issues.push({
      code: "BUDGET_EXCEEDED",
      severity: "error",
      entityIds: placements.map(({ placement }) => placement.id).sort(),
      details: {
        budget: project.budget,
        totalPrice,
        excess: totalPrice - project.budget,
      },
    });
  }
  return issues;
}

function getWallLength(project: GymProject, wall: Wall): number {
  return wall === "top" || wall === "bottom"
    ? project.room.widthCm
    : project.room.depthCm;
}

function validateWallElements(project: GymProject): ValidationIssue[] {
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
