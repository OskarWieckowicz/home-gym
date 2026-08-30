import { evaluateAccess, type DoorAccessRecord, type ProjectAccess, UNEVALUATED_ACCESS } from "@/features/geometry/access-facts";
import { hasUseZoneMargins } from "@/features/geometry/access-targets";
import { blocksMovement } from "@/features/geometry/movement-blockers";
import type { GymProject } from "@/features/project/schemas/project";

import type { ObstacleWithFootprint, ResolvedPlacement } from "./validation-model";
import type { ValidationIssue } from "./validation-issues";

export type AccessValidation = {
  readonly issues: ValidationIssue[];
  readonly access: ProjectAccess;
};

function doorPairs(
  doors: readonly DoorAccessRecord[],
): Array<[DoorAccessRecord, DoorAccessRecord]> {
  const pairs: Array<[DoorAccessRecord, DoorAccessRecord]> = [];
  for (let first = 0; first < doors.length; first += 1) {
    for (let second = first + 1; second < doors.length; second += 1) {
      pairs.push([doors[first], doors[second]]);
    }
  }
  return pairs;
}

function doorsShareComponent(first: DoorAccessRecord, second: DoorAccessRecord): boolean {
  return first.passableComponent > 0 && first.passableComponent === second.passableComponent;
}

function obstructsWalking(item: ObstacleWithFootprint): boolean {
  return (
    item.obstacle.kind === "obstacle" &&
    blocksMovement(item.obstacle.dimensions.heightCm)
  );
}

export function validateAccess(
  project: GymProject,
  items: readonly ObstacleWithFootprint[],
  placements: readonly ResolvedPlacement[],
): AccessValidation {
  const doors = project.wallElements.filter((element) => element.kind === "door");
  const evaluation = evaluateAccess(
    project.room,
    [
      ...items.filter(obstructsWalking).map((item) => item.footprint),
      ...placements
        .filter((placement) =>
          placement.mounting.kind === "wall"
            ? placement.mounting.blocksFloor === true
            : blocksMovement(placement.product.dimensions.heightCm),
        )
        .map((placement) => placement.footprints.physical),
    ],
    doors.map((door) => ({
      id: door.id,
      wall: door.wall,
      offsetCm: door.offsetCm,
      widthCm: door.widthCm,
    })),
    placements.map((placement) => ({
      id: placement.placement.id,
      physical: placement.footprints.physical,
      useZone: placement.footprints.useZone,
      hasUseZoneMargins: hasUseZoneMargins(placement.product.useZone),
    })),
    items
      .filter((item) => item.obstacle.kind === "obstacle")
      .map((item) => ({ id: item.obstacle.id, footprint: item.footprint })),
  );

  if (!evaluation.access.evaluated) {
    return {
      access: UNEVALUATED_ACCESS,
      issues: [{
        code: "ACCESS_NOT_EVALUATED",
        severity: "warning",
        entityIds: [],
        details: { reason: "no-door" },
      }],
    };
  }

  const issues: ValidationIssue[] = [];
  const unblocked = evaluation.doors.filter((door) => !door.blocked);

  for (const door of evaluation.doors) {
    if (door.blocked) {
      issues.push({
        code: "DOOR_BLOCKED",
        severity: "error",
        entityIds: [door.id],
        details: {},
      });
    }
  }

  for (const [first, second] of doorPairs(unblocked)) {
    if (!doorsShareComponent(first, second)) {
      issues.push({
        code: "DOOR_UNREACHABLE",
        severity: "error",
        entityIds: [first.id, second.id].sort() as [string, string],
        details: {},
      });
    }
  }

  for (const fact of evaluation.access.facts) {
    if (fact.state === "tight") {
      issues.push({
        code: "ACCESS_TIGHT",
        severity: "warning",
        entityIds: [fact.entityId],
        details: { kind: fact.kind },
      });
    }
    if (fact.state !== "unreachable") {
      continue;
    }
    if (fact.kind === "use-zone" || fact.kind === "placement") {
      issues.push({
        code: "USE_ZONE_UNREACHABLE",
        severity: "error",
        entityIds: [fact.entityId],
        details: {},
      });
    }
    if (fact.kind === "obstacle") {
      issues.push({
        code: "OBSTACLE_UNREACHABLE",
        severity: "warning",
        entityIds: [fact.entityId],
        details: {},
      });
    }
  }

  return { issues, access: evaluation.access };
}
