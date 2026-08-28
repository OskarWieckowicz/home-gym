import type { RectangleBounds } from "@/features/geometry/rectangles";

export const VALIDATION_ISSUE_CODES = [
  "OUTSIDE_ROOM",
  "PHYSICAL_COLLISION",
  "UNAVAILABLE_ZONE_CONFLICT",
  "OUTSIDE_WALL",
  "WALL_ELEMENT_OVERLAP",
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

export type ValidationIssue =
  | OutsideRoomIssue
  | CollisionIssue
  | OutsideWallIssue
  | WallElementOverlapIssue;
