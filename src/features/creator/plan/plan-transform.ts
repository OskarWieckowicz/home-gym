import { createRectangleFootprint } from "@/features/geometry/rectangles";
import type { Obstacle, Room, WallElement } from "@/features/project/schemas/project";

export type ViewportSize = { readonly width: number; readonly height: number };
export type ClientBounds = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
};
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

export type PlanLine = {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly labelX: number;
  readonly labelY: number;
};

export function clientPointToPlanPoint(
  point: { readonly clientX: number; readonly clientY: number },
  viewport: ViewportSize,
  bounds: ClientBounds,
): { readonly x: number; readonly y: number } {
  const scale = Math.min(bounds.width / viewport.width, bounds.height / viewport.height);
  const horizontalInset = (bounds.width - viewport.width * scale) / 2;
  const verticalInset = (bounds.height - viewport.height * scale) / 2;
  return {
    x: (point.clientX - bounds.left - horizontalInset) / scale,
    y: (point.clientY - bounds.top - verticalInset) / scale,
  };
}

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

export function wallElementToPlanLine(
  element: WallElement,
  transform: PlanTransform,
): PlanLine {
  const start = element.offsetCm * transform.scale;
  const end = (element.offsetCm + element.widthCm) * transform.scale;
  const right = transform.offsetX + transform.roomWidth;
  const bottom = transform.offsetY + transform.roomHeight;

  switch (element.wall) {
    case "top":
      return {
        x1: transform.offsetX + start,
        y1: transform.offsetY,
        x2: transform.offsetX + end,
        y2: transform.offsetY,
        labelX: transform.offsetX + (start + end) / 2,
        labelY: transform.offsetY - 10,
      };
    case "right":
      return {
        x1: right,
        y1: transform.offsetY + start,
        x2: right,
        y2: transform.offsetY + end,
        labelX: right + 10,
        labelY: transform.offsetY + (start + end) / 2,
      };
    case "bottom":
      return {
        x1: transform.offsetX + start,
        y1: bottom,
        x2: transform.offsetX + end,
        y2: bottom,
        labelX: transform.offsetX + (start + end) / 2,
        labelY: bottom + 18,
      };
    case "left":
      return {
        x1: transform.offsetX,
        y1: transform.offsetY + start,
        x2: transform.offsetX,
        y2: transform.offsetY + end,
        labelX: transform.offsetX - 10,
        labelY: transform.offsetY + (start + end) / 2,
      };
  }
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
