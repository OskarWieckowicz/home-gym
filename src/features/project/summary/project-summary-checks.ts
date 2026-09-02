import type { ProjectAnalysis } from "../validation/project-analysis";
import type { ValidationIssue } from "../validation/validation-issues";
import type { SummaryCheck } from "./project-summary-types";

const CHECKS: readonly {
  id: SummaryCheck["id"];
  label: string;
  codes: readonly ValidationIssue["code"][];
}[] = [
  {
    id: "physical-collisions", label: "No object or opening collisions",
    codes: ["PHYSICAL_COLLISION", "UNAVAILABLE_ZONE_CONFLICT", "WALL_ELEMENT_OVERLAP", "WALL_MOUNT_OVERLAPS_OPENING"],
  },
  { id: "use-zones", label: "Use and furniture zones respected", codes: ["USE_ZONE_OVERLAP", "FUNCTIONAL_ZONE_OVERLAP", "USE_ZONE_OUTSIDE_ROOM"] },
  {
    id: "room-bounds", label: "Room fit, height and mounting",
    codes: ["OUTSIDE_ROOM", "OUTSIDE_WALL", "CEILING_TOO_LOW", "WALL_MOUNT_OFF_WALL"],
  },
  { id: "budget", label: "Budget respected", codes: ["BUDGET_EXCEEDED"] },
  {
    id: "access", label: "Access evaluated and clear",
    codes: ["ACCESS_NOT_EVALUATED", "DOOR_BLOCKED", "DOOR_UNREACHABLE", "USE_ZONE_UNREACHABLE", "OBSTACLE_UNREACHABLE", "ACCESS_TIGHT"],
  },
];

export function buildSummaryChecks(analysis: ProjectAnalysis): SummaryCheck[] {
  return CHECKS.map(({ id, label, codes }) => {
    const issues = analysis.issues.filter(({ code }) => codes.includes(code));
    const issueCodes = [...new Set(issues.map(({ code }) => code))];
    const notEvaluated = id === "access" && (!analysis.access.evaluated || issueCodes.includes("ACCESS_NOT_EVALUATED"));
    const passed = issues.length === 0 && !notEvaluated;
    const statusLabel = notEvaluated ? "Not evaluated" : passed ? "Passed" : "Needs attention";
    return { id, label, passed, statusLabel, issueCodes };
  });
}
