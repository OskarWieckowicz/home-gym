import type { Position, Rotation } from "@/features/project/schemas/geometry";
import type { Wall } from "@/features/project/schemas/project";

import {
  createRectangleFootprint,
  getRotatedFootprintDimensions,
  type RectangleBounds,
} from "./rectangles";

const WALLS_IN_TIE_ORDER = ["top", "right", "bottom", "left"] as const;

export function getMountedWall(rotation: Rotation): Wall {
  switch (rotation) {
    case 0:
      return "top";
    case 90:
      return "right";
    case 180:
      return "bottom";
    case 270:
      return "left";
  }
}

export function getMountedWallRotation(wall: Wall): Rotation {
  switch (wall) {
    case "top":
      return 0;
    case "right":
      return 90;
    case "bottom":
      return 180;
    case "left":
      return 270;
  }
}

export function getWallMountFlushGap(
  footprint: RectangleBounds,
  room: { readonly widthCm: number; readonly depthCm: number },
  wall: Wall,
): number {
  switch (wall) {
    case "top":
      return footprint.minZ;
    case "right":
      return room.widthCm - footprint.maxX;
    case "bottom":
      return room.depthCm - footprint.maxZ;
    case "left":
      return footprint.minX;
  }
}

export function isFlushToMountedWall(
  footprint: RectangleBounds,
  room: { readonly widthCm: number; readonly depthCm: number },
  wall: Wall,
): boolean {
  return getWallMountFlushGap(footprint, room, wall) === 0;
}

export function getWallMountSpan(
  footprint: RectangleBounds,
  wall: Wall,
): { readonly startCm: number; readonly endCm: number } {
  if (wall === "left" || wall === "right") {
    return { startCm: footprint.minZ, endCm: footprint.maxZ };
  }
  return { startCm: footprint.minX, endCm: footprint.maxX };
}

export function nearestMountedWall(
  point: Position,
  room: { readonly widthCm: number; readonly depthCm: number },
): Wall {
  const distances: Record<Wall, number> = {
    top: point.zCm,
    right: room.widthCm - point.xCm,
    bottom: room.depthCm - point.zCm,
    left: point.xCm,
  };
  return WALLS_IN_TIE_ORDER.reduce((best, wall) =>
    distances[wall] < distances[best] ? wall : best,
  );
}

function clampSpanStart(centerCm: number, spanCm: number, wallLengthCm: number): number | null {
  if (spanCm > wallLengthCm) return null;
  const maximum = wallLengthCm - spanCm;
  return Math.min(Math.max(0, Math.round(centerCm - spanCm / 2)), maximum);
}

export function snapWallMountedPlacement(
  point: Position,
  dimensions: { readonly widthCm: number; readonly depthCm: number },
  room: { readonly widthCm: number; readonly depthCm: number },
): { readonly position: Position; readonly rotation: Rotation } | null {
  const wall = nearestMountedWall(point, room);
  const rotation = getMountedWallRotation(wall);
  const rotated = getRotatedFootprintDimensions(dimensions, rotation);
  if (wall === "top" || wall === "bottom") {
    const xCm = clampSpanStart(point.xCm, rotated.widthCm, room.widthCm);
    if (xCm === null) return null;
    return {
      rotation,
      position: {
        xCm,
        zCm: wall === "top" ? 0 : room.depthCm - rotated.depthCm,
      },
    };
  }
  const zCm = clampSpanStart(point.zCm, rotated.depthCm, room.depthCm);
  if (zCm === null) return null;
  return {
    rotation,
    position: {
      xCm: wall === "left" ? 0 : room.widthCm - rotated.widthCm,
      zCm,
    },
  };
}

export function constrainMountedDrag(
  next: Position,
  rotation: Rotation,
  dimensions: { readonly widthCm: number; readonly depthCm: number },
  room: { readonly widthCm: number; readonly depthCm: number },
): Position | null {
  const wall = getMountedWall(rotation);
  const rotated = getRotatedFootprintDimensions(dimensions, rotation);
  if (rotated.widthCm > room.widthCm || rotated.depthCm > room.depthCm) {
    return null;
  }
  const unconstrained = createRectangleFootprint(next, dimensions, rotation);
  if (!isFlushToMountedWall(unconstrained, room, wall)) {
    return null;
  }
  return {
    xCm: Math.min(Math.max(0, next.xCm), room.widthCm - rotated.widthCm),
    zCm: Math.min(Math.max(0, next.zCm), room.depthCm - rotated.depthCm),
  };
}
