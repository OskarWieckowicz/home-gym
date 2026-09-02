import { formatPrice } from "@/shared/formatters/catalog-formatters";
import type { ValidationIssue } from "./validation-issues";

const ACCESS_ISSUE_CODES = [
  "ACCESS_NOT_EVALUATED", "DOOR_BLOCKED", "USE_ZONE_UNREACHABLE",
  "OBSTACLE_UNREACHABLE", "ACCESS_TIGHT", "DOOR_UNREACHABLE",
] as const;

type AccessIssue = Extract<ValidationIssue, { readonly code: (typeof ACCESS_ISSUE_CODES)[number] }>;

function isAccessIssue(issue: ValidationIssue): issue is AccessIssue {
  return (ACCESS_ISSUE_CODES as readonly string[]).includes(issue.code);
}

function describeAccessIssue(issue: AccessIssue, label: (id: string) => string): string {
  switch (issue.code) {
    case "ACCESS_NOT_EVALUATED":
      return "Access cannot be evaluated because this room has no door.";
    case "DOOR_BLOCKED":
      return `${label(issue.entityIds[0])} is blocked, so it cannot be used as an entrance.`;
    case "USE_ZONE_UNREACHABLE":
      return `${label(issue.entityIds[0])} cannot be reached from a door.`;
    case "OBSTACLE_UNREACHABLE":
      return `${label(issue.entityIds[0])} cannot be approached from a door.`;
    case "ACCESS_TIGHT":
      return `Access to ${label(issue.entityIds[0])} is tight.`;
    case "DOOR_UNREACHABLE":
      return `${label(issue.entityIds[0])} and ${label(issue.entityIds[1])} cannot be reached from each other.`;
  }
}

export function describeValidationIssue(issue: ValidationIssue, names: ReadonlyMap<string, string>): string {
  const label = (id: string) => names.get(id) ?? id;
  if (issue.code === "OUTSIDE_ROOM") {
    return `${label(issue.entityIds[0])} is outside the room on ${issue.details.axes.join(", ")}.`;
  }
  if (issue.code === "USE_ZONE_OUTSIDE_ROOM") {
    return `${label(issue.entityIds[0])}'s use zone leaves the room on ${issue.details.axes.join(", ")}.`;
  }
  if (issue.code === "OUTSIDE_WALL") {
    return `${label(issue.entityIds[0])} does not fit on the ${issue.details.wall} wall.`;
  }
  if (issue.code === "CEILING_TOO_LOW") {
    return `${label(issue.entityIds[0])} needs ${issue.details.requiredHeightCm} cm of ceiling height; the room has ${issue.details.roomHeightCm} cm.`;
  }
  if (issue.code === "WALL_MOUNT_OFF_WALL") {
    return `${label(issue.entityIds[0])} must sit flush on the ${issue.details.wall} wall; it is ${issue.details.gapCm} cm away.`;
  }
  if (issue.code === "WALL_MOUNT_OVERLAPS_OPENING") {
    return `${label(issue.entityIds[0])} overlaps ${label(issue.entityIds[1])} on the ${issue.details.wall} wall.`;
  }
  if (issue.code === "BUDGET_EXCEEDED") {
    return `Project equipment costs ${formatPrice(issue.details.totalPrice)}, exceeding the ${formatPrice(issue.details.budget)} budget by ${formatPrice(issue.details.excess)}.`;
  }
  if (isAccessIssue(issue)) return describeAccessIssue(issue, label);
  const pair = `${label(issue.entityIds[0])} and ${label(issue.entityIds[1])}`;
  if (issue.code === "WALL_ELEMENT_OVERLAP") {
    return `${pair} overlap on the ${issue.details.wall} wall.`;
  }
  if (issue.code === "USE_ZONE_OVERLAP") {
    return issue.severity === "warning"
      ? `${pair} share a use zone.`
      : `${pair} conflict with a required use zone.`;
  }
  if (issue.code === "FUNCTIONAL_ZONE_OVERLAP") {
    return issue.severity === "error"
      ? `${label(issue.details.blockingEntityId)} blocks the functional clearance of ${label(issue.details.zoneOwnerId)}.`
      : `${label(issue.details.blockingEntityId)} overlaps the functional clearance of ${label(issue.details.zoneOwnerId)}.`;
  }
  return issue.code === "PHYSICAL_COLLISION"
    ? `${pair} physically overlap.`
    : `${pair} conflict with an unavailable zone.`;
}
