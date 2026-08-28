import type { Room, Wall } from "@/features/project/schemas/project";

import {
  planPointToCentimeters,
  snapCentimeters,
  type PlanTransform,
} from "./plan-transform";

export type PlanPoint = { readonly x: number; readonly y: number };

export type PlacementTarget =
  | { readonly kind: "floor"; readonly position: { readonly xCm: number; readonly zCm: number } }
  | { readonly kind: "wall"; readonly wall: Wall; readonly offsetCm: number };

type WallDistance = {
  readonly wall: Wall;
  readonly distance: number;
  readonly offsetPlan: number;
};

function wallDistances(point: PlanPoint, transform: PlanTransform): WallDistance[] {
  const right = transform.offsetX + transform.roomWidth;
  const bottom = transform.offsetY + transform.roomHeight;
  return [
    { wall: "top", distance: Math.abs(point.y - transform.offsetY), offsetPlan: point.x - transform.offsetX },
    { wall: "right", distance: Math.abs(point.x - right), offsetPlan: point.y - transform.offsetY },
    { wall: "bottom", distance: Math.abs(point.y - bottom), offsetPlan: point.x - transform.offsetX },
    { wall: "left", distance: Math.abs(point.x - transform.offsetX), offsetPlan: point.y - transform.offsetY },
  ];
}

function insideExpandedRoom(
  point: PlanPoint,
  transform: PlanTransform,
  tolerance: number,
): boolean {
  return (
    point.x >= transform.offsetX - tolerance &&
    point.x <= transform.offsetX + transform.roomWidth + tolerance &&
    point.y >= transform.offsetY - tolerance &&
    point.y <= transform.offsetY + transform.roomHeight + tolerance
  );
}

function insideFloor(point: PlanPoint, transform: PlanTransform): boolean {
  return (
    point.x > transform.offsetX &&
    point.x < transform.offsetX + transform.roomWidth &&
    point.y > transform.offsetY &&
    point.y < transform.offsetY + transform.roomHeight
  );
}

export function getPlacementTarget(
  point: PlanPoint,
  transform: PlanTransform,
  targetKind: "floor" | "wall",
  wallTolerance = 14,
): PlacementTarget | null {
  if (targetKind === "floor") {
    return insideFloor(point, transform)
      ? { kind: "floor", position: planPointToCentimeters(point, transform) }
      : null;
  }

  if (!insideExpandedRoom(point, transform, wallTolerance)) return null;
  const nearest = wallDistances(point, transform).reduce((best, candidate) =>
    candidate.distance < best.distance ? candidate : best,
  );
  if (nearest.distance > wallTolerance) return null;

  const wallLengthPlan = nearest.wall === "top" || nearest.wall === "bottom"
    ? transform.roomWidth
    : transform.roomHeight;
  if (nearest.offsetPlan < 0 || nearest.offsetPlan > wallLengthPlan) return null;

  return {
    kind: "wall",
    wall: nearest.wall,
    offsetCm: snapCentimeters(nearest.offsetPlan / transform.scale),
  };
}

export function centerFloorRectangle(
  center: { readonly xCm: number; readonly zCm: number },
  dimensions: { readonly widthCm: number; readonly depthCm: number },
  room: Pick<Room, "widthCm" | "depthCm">,
): { readonly xCm: number; readonly zCm: number } | null {
  if (dimensions.widthCm > room.widthCm || dimensions.depthCm > room.depthCm) return null;
  const maximumX = room.widthCm - dimensions.widthCm;
  const maximumZ = room.depthCm - dimensions.depthCm;
  return {
    xCm: Math.min(snapCentimeters(Math.min(
      Math.max(0, center.xCm - dimensions.widthCm / 2),
      maximumX,
    )), maximumX),
    zCm: Math.min(snapCentimeters(Math.min(
      Math.max(0, center.zCm - dimensions.depthCm / 2),
      maximumZ,
    )), maximumZ),
  };
}

export function centerWallElement(
  centerOffsetCm: number,
  widthCm: number,
  wallLengthCm: number,
): number | null {
  if (widthCm > wallLengthCm) return null;
  const maximumOffset = wallLengthCm - widthCm;
  return Math.min(snapCentimeters(Math.min(
    Math.max(0, centerOffsetCm - widthCm / 2),
    maximumOffset,
  )), maximumOffset);
}
