import { createRectangleFootprint } from "@/features/geometry/rectangles";
import type { Obstacle, Room } from "@/features/project/schemas/project";

export type ViewportSize = { readonly width: number; readonly height: number };
export type PlanTransform = {
  readonly scale: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly roomWidth: number;
  readonly roomHeight: number;
};

export type PlanRectangle = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

export function createPlanTransform(
  room: Pick<Room, "widthCm" | "depthCm">,
  viewport: ViewportSize,
  padding = 32,
): PlanTransform {
  const drawableWidth = Math.max(1, viewport.width - padding * 2);
  const drawableHeight = Math.max(1, viewport.height - padding * 2);
  const scale = Math.min(drawableWidth / room.widthCm, drawableHeight / room.depthCm);
  const roomWidth = room.widthCm * scale;
  const roomHeight = room.depthCm * scale;
  return {
    scale,
    roomWidth,
    roomHeight,
    offsetX: (viewport.width - roomWidth) / 2,
    offsetY: (viewport.height - roomHeight) / 2,
  };
}

export function obstacleToPlanRectangle(
  obstacle: Obstacle,
  transform: PlanTransform,
): PlanRectangle {
  const footprint = createRectangleFootprint(
    obstacle.position,
    obstacle.dimensions,
    obstacle.rotation,
  );
  return {
    x: transform.offsetX + footprint.minX * transform.scale,
    y: transform.offsetY + footprint.minZ * transform.scale,
    width: footprint.widthCm * transform.scale,
    height: footprint.depthCm * transform.scale,
  };
}

export function snapCentimeters(value: number, increment = 10): number {
  return Math.max(0, Math.round(value / increment) * increment);
}

export function planDeltaToCentimeters(
  delta: { readonly x: number; readonly y: number },
  transform: Pick<PlanTransform, "scale">,
  increment = 10,
): { readonly xCm: number; readonly zCm: number } {
  return {
    xCm: Math.round(delta.x / transform.scale / increment) * increment,
    zCm: Math.round(delta.y / transform.scale / increment) * increment,
  };
}

export function planPointToCentimeters(
  point: { readonly x: number; readonly y: number },
  transform: PlanTransform,
  increment = 10,
): { readonly xCm: number; readonly zCm: number } {
  return {
    xCm: snapCentimeters((point.x - transform.offsetX) / transform.scale, increment),
    zCm: snapCentimeters((point.y - transform.offsetY) / transform.scale, increment),
  };
}
