import type { RectangleBounds } from "@/features/geometry/rectangles";

export const VALIDATION_ISSUE_CODES = [
  "OUTSIDE_ROOM",
  "PHYSICAL_COLLISION",
  "UNAVAILABLE_ZONE_CONFLICT",
  "OUTSIDE_WALL",
  "WALL_ELEMENT_OVERLAP",
  "USE_ZONE_OVERLAP",
  "USE_ZONE_OUTSIDE_ROOM",
  "CEILING_TOO_LOW",
  "WALL_MOUNT_OFF_WALL",
  "WALL_MOUNT_OVERLAPS_OPENING",
  "BUDGET_EXCEEDED",
  "DOOR_BLOCKED",
  "DOOR_UNREACHABLE",
  "USE_ZONE_UNREACHABLE",
  "OBSTACLE_UNREACHABLE",
  "ACCESS_TIGHT",
  "ACCESS_NOT_EVALUATED",
] as const;

export type ValidationSeverity = "error" | "warning";

export type OutsideRoomAxis = "x" | "z" | "height";

export type OutsideRoomIssue = {
  readonly code: "OUTSIDE_ROOM";
  readonly severity: "error";
  readonly entityIds: readonly [string];
  readonly details: {
    readonly axes: readonly OutsideRoomAxis[];
    readonly footprint: RectangleBounds;
    readonly room: {
      readonly widthCm: number;
      readonly depthCm: number;
      readonly heightCm: number;
    };
    readonly entityHeightCm?: number;
  };
};

export type CollisionIssue = {
  readonly code: "PHYSICAL_COLLISION" | "UNAVAILABLE_ZONE_CONFLICT";
  readonly severity: "error";
  readonly entityIds: readonly [string, string];
  readonly details: {
    readonly overlap: RectangleBounds;
  };
};

export type OutsideWallIssue = {
  readonly code: "OUTSIDE_WALL";
  readonly severity: "error";
  readonly entityIds: readonly [string];
  readonly details: {
    readonly wall: "top" | "right" | "bottom" | "left";
    readonly wallLengthCm: number;
    readonly offsetCm: number;
    readonly widthCm: number;
  };
};

export type WallElementOverlapIssue = {
  readonly code: "WALL_ELEMENT_OVERLAP";
  readonly severity: "error";
  readonly entityIds: readonly [string, string];
  readonly details: {
    readonly wall: "top" | "right" | "bottom" | "left";
    readonly overlap: { readonly startCm: number; readonly endCm: number };
  };
};

export type UseZoneOverlapIssue = {
  readonly code: "USE_ZONE_OVERLAP";
  readonly severity: ValidationSeverity;
  readonly entityIds: readonly [string, string];
  readonly details: {
    readonly overlap: RectangleBounds;
    readonly useZonePlacementId: string;
    readonly blockingEntityId: string;
  };
};

export type UseZoneOutsideRoomIssue = {
  readonly code: "USE_ZONE_OUTSIDE_ROOM";
  readonly severity: "error";
  readonly entityIds: readonly [string];
  readonly details: {
    readonly axes: readonly ("x" | "z")[];
    readonly footprint: RectangleBounds;
    readonly room: {
      readonly widthCm: number;
      readonly depthCm: number;
      readonly heightCm: number;
    };
  };
};

export type CeilingTooLowIssue = {
  readonly code: "CEILING_TOO_LOW";
  readonly severity: "error";
  readonly entityIds: readonly [string];
  readonly details: {
    readonly roomHeightCm: number;
    readonly productHeightCm: number;
    readonly requiredHeightCm: number;
    readonly mountBottomHeightCm?: number;
  };
};

export type WallMountOffWallIssue = {
  readonly code: "WALL_MOUNT_OFF_WALL";
  readonly severity: "error";
  readonly entityIds: readonly [string];
  readonly details: {
    readonly wall: "top" | "right" | "bottom" | "left";
    readonly gapCm: number;
  };
};

export type WallMountOverlapsOpeningIssue = {
  readonly code: "WALL_MOUNT_OVERLAPS_OPENING";
  readonly severity: "error";
  readonly entityIds: readonly [string, string];
  readonly details: {
    readonly wall: "top" | "right" | "bottom" | "left";
    readonly overlap: { readonly startCm: number; readonly endCm: number };
  };
};

export type BudgetExceededIssue = {
  readonly code: "BUDGET_EXCEEDED";
  readonly severity: "error";
  readonly entityIds: readonly string[];
  readonly details: {
    readonly budget: number;
    readonly totalPrice: number;
    readonly excess: number;
  };
};

export type DoorBlockedIssue = {
  readonly code: "DOOR_BLOCKED";
  readonly severity: "error";
  readonly entityIds: readonly [string];
  readonly details: Record<string, never>;
};

export type DoorUnreachableIssue = {
  readonly code: "DOOR_UNREACHABLE";
  readonly severity: "error";
  readonly entityIds: readonly [string, string];
  readonly details: Record<string, never>;
};

export type UseZoneUnreachableIssue = {
  readonly code: "USE_ZONE_UNREACHABLE";
  readonly severity: "error";
  readonly entityIds: readonly [string];
  readonly details: Record<string, never>;
};

export type ObstacleUnreachableIssue = {
  readonly code: "OBSTACLE_UNREACHABLE";
  readonly severity: "warning";
  readonly entityIds: readonly [string];
  readonly details: Record<string, never>;
};

export type AccessTightIssue = {
  readonly code: "ACCESS_TIGHT";
  readonly severity: "warning";
  readonly entityIds: readonly [string];
  readonly details: {
    readonly kind: "door" | "use-zone" | "placement" | "obstacle";
  };
};

export type AccessNotEvaluatedIssue = {
  readonly code: "ACCESS_NOT_EVALUATED";
  readonly severity: "warning";
  readonly entityIds: readonly [];
  readonly details: {
    readonly reason: "no-door";
  };
};

export type ValidationIssue =
  | OutsideRoomIssue
  | CollisionIssue
  | UseZoneOverlapIssue
  | UseZoneOutsideRoomIssue
  | CeilingTooLowIssue
  | WallMountOffWallIssue
  | WallMountOverlapsOpeningIssue
  | BudgetExceededIssue
  | OutsideWallIssue
  | WallElementOverlapIssue
  | DoorBlockedIssue
  | DoorUnreachableIssue
  | UseZoneUnreachableIssue
  | ObstacleUnreachableIssue
  | AccessTightIssue
  | AccessNotEvaluatedIssue;
