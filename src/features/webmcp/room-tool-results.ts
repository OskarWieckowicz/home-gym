import { findProductById, getEffectiveMounting } from "@/features/catalog/queries";
import type { CommandErrorCode, DispatchResult } from "@/features/project/commands/command-results";
import type { AccessImpact } from "@/features/project/validation/access-impact";
import type { ProjectAccess } from "@/features/geometry/access-facts";
import {
  findPlacementForItem,
  productIdForPlacement,
} from "@/features/project/project-lookups";
import type {
  GymProject,
  Obstacle,
  Placement,
  ProjectItem,
  ProjectSettings,
  Room,
  WallElement,
} from "@/features/project/schemas/project";
import type { ProjectAnalysis } from "@/features/project/validation/analyze-project";
import type { ValidationIssue } from "@/features/project/validation/validation-issues";

import type { InputIssue } from "./room-tool-schemas";

export type RoomToolName =
  | "get_project_state"
  | "validate_layout"
  | "configure_room"
  | "update_project_settings"
  | "add_obstacle"
  | "update_obstacle"
  | "remove_obstacle"
  | "add_wall_element"
  | "update_wall_element"
  | "remove_wall_element"
  | "place_product"
  | "add_product_to_project"
  | "place_project_item"
  | "update_placement"
  | "unplace_product"
  | "remove_product";

export type RoomToolErrorCode = "INVALID_INPUT" | CommandErrorCode;

export function createRoomToolError(
  tool: RoomToolName,
  code: RoomToolErrorCode,
  message: string,
  issues?: readonly InputIssue[],
) {
  return {
    ok: false as const,
    tool,
    error: { code, message, ...(issues?.length ? { issues: [...issues] } : {}) },
  };
}

export function serializeRoom(room: Room) {
  return { ...room };
}

export function serializeSettings(settings: ProjectSettings) {
  return {
    budget: settings.budget,
    trainingGoals: [...settings.trainingGoals],
  };
}

export function serializeObstacle(obstacle: Obstacle) {
  return {
    ...obstacle,
    position: { ...obstacle.position },
    dimensions: { ...obstacle.dimensions },
  };
}

export function serializeWallElement(wallElement: WallElement) {
  return { ...wallElement };
}

export function serializeProjectItem(item: ProjectItem, project: GymProject) {
  const product = findProductById(item.productId);
  const placement = findPlacementForItem(project, item.id);
  return {
    id: item.id,
    productId: item.productId,
    placementId: placement?.id ?? null,
    placed: placement !== undefined,
    placementMode: product?.placementMode ?? "floor",
    name: product?.name,
    price: product?.price,
  };
}

export function serializePlacement(placement: Placement, project: GymProject) {
  const productId = productIdForPlacement(project, placement);
  const product = productId ? findProductById(productId) : undefined;
  return {
    id: placement.id,
    projectItemId: placement.projectItemId,
    productId,
    position: { ...placement.position },
    rotation: placement.rotation,
    mounting: product ? getEffectiveMounting(product) : { kind: "floor" as const },
  };
}

export function serializeProject(project: GymProject) {
  return {
    version: project.version,
    room: serializeRoom(project.room),
    obstacles: project.obstacles.map(serializeObstacle),
    wallElements: project.wallElements.map(serializeWallElement),
    projectItems: project.projectItems.map((item) => serializeProjectItem(item, project)),
    placements: project.placements.map((placement) => serializePlacement(placement, project)),
    budget: project.budget,
    trainingGoals: [...project.trainingGoals],
  };
}

export function serializeValidationIssue(issue: ValidationIssue): ValidationIssue {
  if (issue.code === "OUTSIDE_ROOM") {
    return {
      ...issue,
      entityIds: [...issue.entityIds] as [string],
      details: {
        ...issue.details,
        axes: [...issue.details.axes],
        footprint: { ...issue.details.footprint },
        room: { ...issue.details.room },
      },
    };
  }

  if (issue.code === "USE_ZONE_OUTSIDE_ROOM") {
    return {
      ...issue,
      entityIds: [...issue.entityIds] as [string],
      details: {
        ...issue.details,
        axes: [...issue.details.axes],
        footprint: { ...issue.details.footprint },
        room: { ...issue.details.room },
      },
    };
  }

  if (issue.code === "OUTSIDE_WALL") {
    return {
      ...issue,
      entityIds: [...issue.entityIds] as [string],
      details: { ...issue.details },
    };
  }

  if (issue.code === "WALL_ELEMENT_OVERLAP") {
    return {
      ...issue,
      entityIds: [...issue.entityIds] as [string, string],
      details: {
        ...issue.details,
        overlap: { ...issue.details.overlap },
      },
    };
  }

  if (issue.code === "BUDGET_EXCEEDED") {
    return {
      ...issue,
      entityIds: [...issue.entityIds],
      details: { ...issue.details },
    };
  }

  if (issue.code === "CEILING_TOO_LOW") {
    return {
      ...issue,
      entityIds: [...issue.entityIds] as [string],
      details: { ...issue.details },
    };
  }

  if (issue.code === "WALL_MOUNT_OFF_WALL") {
    return {
      ...issue,
      entityIds: [...issue.entityIds] as [string],
      details: { ...issue.details },
    };
  }

  if (issue.code === "WALL_MOUNT_OVERLAPS_OPENING") {
    return {
      ...issue,
      entityIds: [...issue.entityIds] as [string, string],
      details: {
        ...issue.details,
        overlap: { ...issue.details.overlap },
      },
    };
  }

  if (issue.code === "USE_ZONE_OVERLAP") {
    return {
      ...issue,
      entityIds: [...issue.entityIds] as [string, string],
      details: {
        ...issue.details,
        overlap: { ...issue.details.overlap },
      },
    };
  }

  if (issue.code === "ACCESS_NOT_EVALUATED") {
    return {
      ...issue,
      entityIds: [],
      details: { ...issue.details },
    };
  }

  if (issue.code === "DOOR_UNREACHABLE") {
    return {
      ...issue,
      entityIds: [...issue.entityIds] as [string, string],
      details: { ...issue.details },
    };
  }

  if (issue.code === "ACCESS_TIGHT") {
    return {
      ...issue,
      entityIds: [...issue.entityIds] as [string],
      details: { ...issue.details },
    };
  }

  if (
    issue.code === "DOOR_BLOCKED" ||
    issue.code === "USE_ZONE_UNREACHABLE" ||
    issue.code === "OBSTACLE_UNREACHABLE"
  ) {
    return {
      ...issue,
      entityIds: [...issue.entityIds] as [string],
      details: { ...issue.details },
    };
  }

  return {
    ...issue,
    entityIds: [...issue.entityIds] as [string, string],
    details: { overlap: { ...issue.details.overlap } },
  };
}

export function serializeAccess(access: ProjectAccess) {
  return {
    evaluated: access.evaluated,
    reason: access.reason,
    facts: access.facts.map((fact) => ({ ...fact })),
  };
}

export function serializeAccessImpact(impact: AccessImpact) {
  return {
    madeUnreachable: impact.madeUnreachable.map((entry) => ({ ...entry })),
    restored: impact.restored.map((entry) => ({ ...entry })),
  };
}

export function serializeMutationBase(
  tool: RoomToolName,
  result: Extract<DispatchResult, { ok: true }>,
) {
  return {
    ok: true as const,
    tool,
    changed: result.changed,
    revision: result.revision,
    affectedEntityIds: [...result.affectedEntityIds],
    accessImpact: serializeAccessImpact(result.accessImpact),
  };
}

export function serializeValidation(analysis: ProjectAnalysis) {
  const clonedIssues = analysis.issues.map(serializeValidationIssue);
  const errorCount = clonedIssues.filter((issue) => issue.severity === "error").length;
  const warningCount = clonedIssues.filter((issue) => issue.severity === "warning").length;
  return {
    valid: errorCount === 0,
    errorCount,
    warningCount,
    issueCount: clonedIssues.length,
    issueCounts: {
      outsideRoom: clonedIssues.filter(({ code }) => code === "OUTSIDE_ROOM").length,
      useZoneOutsideRoom: clonedIssues.filter(
        ({ code }) => code === "USE_ZONE_OUTSIDE_ROOM",
      ).length,
      physicalCollision: clonedIssues.filter(
        ({ code }) => code === "PHYSICAL_COLLISION",
      ).length,
      unavailableZoneConflict: clonedIssues.filter(
        ({ code }) => code === "UNAVAILABLE_ZONE_CONFLICT",
      ).length,
      outsideWall: clonedIssues.filter(({ code }) => code === "OUTSIDE_WALL").length,
      wallElementOverlap: clonedIssues.filter(
        ({ code }) => code === "WALL_ELEMENT_OVERLAP",
      ).length,
      useZoneOverlap: clonedIssues.filter(
        ({ code }) => code === "USE_ZONE_OVERLAP",
      ).length,
      ceilingTooLow: clonedIssues.filter(
        ({ code }) => code === "CEILING_TOO_LOW",
      ).length,
      wallMountOffWall: clonedIssues.filter(
        ({ code }) => code === "WALL_MOUNT_OFF_WALL",
      ).length,
      wallMountOverlapsOpening: clonedIssues.filter(
        ({ code }) => code === "WALL_MOUNT_OVERLAPS_OPENING",
      ).length,
      budgetExceeded: clonedIssues.filter(
        ({ code }) => code === "BUDGET_EXCEEDED",
      ).length,
      doorBlocked: clonedIssues.filter(({ code }) => code === "DOOR_BLOCKED").length,
      doorUnreachable: clonedIssues.filter(
        ({ code }) => code === "DOOR_UNREACHABLE",
      ).length,
      useZoneUnreachable: clonedIssues.filter(
        ({ code }) => code === "USE_ZONE_UNREACHABLE",
      ).length,
      obstacleUnreachable: clonedIssues.filter(
        ({ code }) => code === "OBSTACLE_UNREACHABLE",
      ).length,
      accessTight: clonedIssues.filter(({ code }) => code === "ACCESS_TIGHT").length,
      accessNotEvaluated: clonedIssues.filter(
        ({ code }) => code === "ACCESS_NOT_EVALUATED",
      ).length,
    },
    access: serializeAccess(analysis.access),
    items: analysis.items.map((item) => ({ ...item })),
    coverage: {
      requested: [...analysis.coverage.requested],
      covered: [...analysis.coverage.covered],
      uncovered: [...analysis.coverage.uncovered],
    },
    issues: clonedIssues,
  };
}
