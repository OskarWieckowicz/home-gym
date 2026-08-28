import type { RectangleBounds } from "@/features/geometry/rectangles";

export const VALIDATION_ISSUE_CODES = [
  "OUTSIDE_ROOM",
  "PHYSICAL_COLLISION",
  "UNAVAILABLE_ZONE_CONFLICT",
] as const;

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
    readonly entityHeightCm: number;
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

export type ValidationIssue = OutsideRoomIssue | CollisionIssue;
