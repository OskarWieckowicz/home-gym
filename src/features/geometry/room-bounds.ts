import type { RectangleBounds } from "./rectangles";

import type { Room } from "@/features/project/schemas/project";

export type HorizontalRoomAxis = "x" | "z";

export function getOutsideHorizontalAxes(
  footprint: RectangleBounds,
  room: Room,
): HorizontalRoomAxis[] {
  const axes: HorizontalRoomAxis[] = [];

  if (footprint.minX < 0 || footprint.maxX > room.widthCm) {
    axes.push("x");
  }
  if (footprint.minZ < 0 || footprint.maxZ > room.depthCm) {
    axes.push("z");
  }

  return axes;
}

export function fitsRoomHeight(heightCm: number, room: Room): boolean {
  return heightCm <= room.heightCm;
}
