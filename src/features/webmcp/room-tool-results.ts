import type { CommandErrorCode } from "@/features/project/commands/command-results";
import type {
  GymProject,
  Obstacle,
  ProjectSettings,
  Room,
} from "@/features/project/schemas/project";
import type { ValidationIssue } from "@/features/project/validation/validation-issues";

import type { InputIssue } from "./room-tool-schemas";

export type RoomToolName =
  | "get_project_state"
  | "validate_layout"
  | "configure_room"
  | "update_project_settings"
  | "add_obstacle"
  | "update_obstacle"
  | "remove_obstacle";

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

export function serializeProject(project: GymProject) {
  return {
    version: project.version,
    room: serializeRoom(project.room),
    obstacles: project.obstacles.map(serializeObstacle),
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

  return {
    ...issue,
    entityIds: [...issue.entityIds] as [string, string],
    details: { overlap: { ...issue.details.overlap } },
  };
}

export function serializeValidation(issues: readonly ValidationIssue[]) {
  const clonedIssues = issues.map(serializeValidationIssue);
  return {
    valid: clonedIssues.length === 0,
    issueCount: clonedIssues.length,
    issueCounts: {
      outsideRoom: clonedIssues.filter(({ code }) => code === "OUTSIDE_ROOM").length,
      physicalCollision: clonedIssues.filter(
        ({ code }) => code === "PHYSICAL_COLLISION",
      ).length,
      unavailableZoneConflict: clonedIssues.filter(
        ({ code }) => code === "UNAVAILABLE_ZONE_CONFLICT",
      ).length,
    },
    issues: clonedIssues,
  };
}
