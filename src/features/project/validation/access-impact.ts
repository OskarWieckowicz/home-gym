import type { ProjectAnalysis } from "./project-analysis";
import type { ValidationIssue } from "./validation-issues";

export const ACCESS_IMPACT_REASONS = [
  "DOOR_BLOCKED",
  "DOOR_UNREACHABLE",
  "USE_ZONE_UNREACHABLE",
  "OBSTACLE_UNREACHABLE",
] as const;

export type AccessImpactReason = (typeof ACCESS_IMPACT_REASONS)[number];

export type AccessImpactEntry = {
  readonly entityId: string;
  readonly reason: AccessImpactReason;
};

export type AccessImpact = {
  readonly madeUnreachable: readonly AccessImpactEntry[];
  readonly restored: readonly AccessImpactEntry[];
};

const REASON_PRIORITY: Readonly<Record<AccessImpactReason, number>> = {
  DOOR_BLOCKED: 0,
  DOOR_UNREACHABLE: 1,
  USE_ZONE_UNREACHABLE: 2,
  OBSTACLE_UNREACHABLE: 3,
};

const IMPACT_CODES = new Set<string>(ACCESS_IMPACT_REASONS);

export const EMPTY_ACCESS_IMPACT: AccessImpact = {
  madeUnreachable: [],
  restored: [],
};

function isAccessImpactReason(code: string): code is AccessImpactReason {
  return IMPACT_CODES.has(code);
}

function unreachableByEntity(
  issues: readonly ValidationIssue[],
): Map<string, AccessImpactReason> {
  const byId = new Map<string, AccessImpactReason>();
  for (const issue of issues) {
    if (!isAccessImpactReason(issue.code)) {
      continue;
    }
    for (const entityId of issue.entityIds) {
      const current = byId.get(entityId);
      if (!current || REASON_PRIORITY[issue.code] < REASON_PRIORITY[current]) {
        byId.set(entityId, issue.code);
      }
    }
  }
  return byId;
}

function entriesFrom(
  map: ReadonlyMap<string, AccessImpactReason>,
  include: (entityId: string) => boolean,
): AccessImpactEntry[] {
  return [...map.entries()]
    .filter(([entityId]) => include(entityId))
    .map(([entityId, reason]) => ({ entityId, reason }))
    .sort((first, second) => (first.entityId < second.entityId ? -1 : 1));
}

export function diffAccessImpact(
  previous: ProjectAnalysis,
  current: ProjectAnalysis,
): AccessImpact {
  if (!previous.access.evaluated || !current.access.evaluated) {
    return EMPTY_ACCESS_IMPACT;
  }

  const previousUnreachable = unreachableByEntity(previous.issues);
  const currentUnreachable = unreachableByEntity(current.issues);
  return {
    madeUnreachable: entriesFrom(
      currentUnreachable,
      (entityId) => !previousUnreachable.has(entityId),
    ),
    restored: entriesFrom(
      previousUnreachable,
      (entityId) => !currentUnreachable.has(entityId),
    ),
  };
}
