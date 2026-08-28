import type {
  Dimensions,
  Position,
  Rotation,
} from "@/features/project/schemas/geometry";

export type RectangleBounds = {
  readonly minX: number;
  readonly minZ: number;
  readonly maxX: number;
  readonly maxZ: number;
};

export type RectangleFootprint = RectangleBounds & {
  readonly widthCm: number;
  readonly depthCm: number;
};

export function getRotatedFootprintDimensions(
  dimensions: Pick<Dimensions, "widthCm" | "depthCm">,
  rotation: Rotation,
): Pick<RectangleFootprint, "widthCm" | "depthCm"> {
  const swapsAxes = rotation === 90 || rotation === 270;

  return swapsAxes
    ? { widthCm: dimensions.depthCm, depthCm: dimensions.widthCm }
    : { widthCm: dimensions.widthCm, depthCm: dimensions.depthCm };
}

export function createRectangleFootprint(
  position: Position,
  dimensions: Dimensions,
  rotation: Rotation,
): RectangleFootprint {
  const rotated = getRotatedFootprintDimensions(dimensions, rotation);

  return {
    minX: position.xCm,
    minZ: position.zCm,
    maxX: position.xCm + rotated.widthCm,
    maxZ: position.zCm + rotated.depthCm,
    ...rotated,
  };
}

export function intersectRectangles(
  first: RectangleBounds,
  second: RectangleBounds,
): RectangleBounds | null {
  const intersection = {
    minX: Math.max(first.minX, second.minX),
    minZ: Math.max(first.minZ, second.minZ),
    maxX: Math.min(first.maxX, second.maxX),
    maxZ: Math.min(first.maxZ, second.maxZ),
  };

  if (
    intersection.maxX <= intersection.minX ||
    intersection.maxZ <= intersection.minZ
  ) {
    return null;
  }

  return intersection;
}

export function rectanglesOverlap(
  first: RectangleBounds,
  second: RectangleBounds,
): boolean {
  return intersectRectangles(first, second) !== null;
}
