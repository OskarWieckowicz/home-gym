import type { Room } from "@/features/project/schemas/project";
import { intersectRectangles, type RectangleBounds } from "./rectangles";

export type FloorArea = {
  readonly roomAreaCm2: number;
  readonly occupiedAreaCm2: number;
  readonly freeAreaCm2: number;
  readonly freeRatio: number;
};

function coveredLength(intervals: readonly RectangleBounds[]): number {
  const ordered = [...intervals].sort((a, b) => a.minZ - b.minZ);
  let length = 0;
  let end = 0;
  for (const interval of ordered) {
    length += Math.max(0, interval.maxZ - Math.max(end, interval.minZ));
    end = Math.max(end, interval.maxZ);
  }
  return length;
}

/**
 * Exact union of axis-aligned footprints clipped to the room; overlaps count once.
 * A sweep through rectangle X edges integrates merged Z intervals, without a grid
 * or sampling approximation. Callers supply only floor-reserving footprints, not
 * equipment use zones. Positive room dimensions are guaranteed by the room schema.
 */
export function calculateFloorArea(
  room: Pick<Room, "widthCm" | "depthCm">,
  footprints: readonly RectangleBounds[],
): FloorArea {
  const roomBounds = { minX: 0, minZ: 0, maxX: room.widthCm, maxZ: room.depthCm };
  const clipped = footprints.flatMap((footprint) => {
    const intersection = intersectRectangles(footprint, roomBounds);
    return intersection ? [intersection] : [];
  });
  const edges = [...new Set(clipped.flatMap(({ minX, maxX }) => [minX, maxX]))]
    .sort((a, b) => a - b);
  let occupiedAreaCm2 = 0;
  for (let index = 1; index < edges.length; index += 1) {
    const left = edges[index - 1];
    const right = edges[index];
    const active = clipped.filter(({ minX, maxX }) => minX < right && maxX > left);
    occupiedAreaCm2 += (right - left) * coveredLength(active);
  }
  const roomAreaCm2 = room.widthCm * room.depthCm;
  const freeAreaCm2 = roomAreaCm2 - occupiedAreaCm2;
  return { roomAreaCm2, occupiedAreaCm2, freeAreaCm2, freeRatio: freeAreaCm2 / roomAreaCm2 };
}
