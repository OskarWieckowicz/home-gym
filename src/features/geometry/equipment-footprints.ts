import type { Placement } from "@/features/project/schemas/project";

import {
  createRectangleFootprint,
  intersectRectangles,
  type RectangleBounds,
  type RectangleFootprint,
} from "./rectangles";

export type ProductUseZone = {
  readonly frontCm: number;
  readonly backCm: number;
  readonly leftCm: number;
  readonly rightCm: number;
};

export type ProductGeometryDescriptor = {
  readonly dimensions: {
    readonly widthCm: number;
    readonly depthCm: number;
  };
  readonly useZone: ProductUseZone;
};

export type EquipmentFootprints = {
  readonly physical: RectangleFootprint;
  readonly useZone: RectangleFootprint;
};

function hasArea(rectangle: RectangleBounds): boolean {
  return rectangle.maxX > rectangle.minX && rectangle.maxZ > rectangle.minZ;
}

/**
 * Returns a deterministic, non-overlapping partition of useZone - physical.
 * Edge-touching rectangles do not subtract area, matching rectangle collision
 * semantics throughout the geometry layer.
 */
export function getUseZoneMarginRectangles(
  useZone: RectangleBounds,
  physical: RectangleBounds,
): readonly RectangleBounds[] {
  const overlap = intersectRectangles(useZone, physical);
  if (!overlap) return hasArea(useZone) ? [{ ...useZone }] : [];

  return [
    { minX: useZone.minX, minZ: useZone.minZ, maxX: useZone.maxX, maxZ: overlap.minZ },
    { minX: useZone.minX, minZ: overlap.minZ, maxX: overlap.minX, maxZ: overlap.maxZ },
    { minX: overlap.maxX, minZ: overlap.minZ, maxX: useZone.maxX, maxZ: overlap.maxZ },
    { minX: useZone.minX, minZ: overlap.maxZ, maxX: useZone.maxX, maxZ: useZone.maxZ },
  ].filter(hasArea);
}

type FootprintInsets = {
  readonly minX: number;
  readonly minZ: number;
  readonly maxX: number;
  readonly maxZ: number;
};

export function getRotatedUseZoneInsets(
  useZone: ProductUseZone,
  rotation: Placement["rotation"],
): FootprintInsets {
  switch (rotation) {
    case 0:
      return {
        minX: useZone.leftCm,
        minZ: useZone.backCm,
        maxX: useZone.rightCm,
        maxZ: useZone.frontCm,
      };
    case 90:
      return {
        minX: useZone.frontCm,
        minZ: useZone.leftCm,
        maxX: useZone.backCm,
        maxZ: useZone.rightCm,
      };
    case 180:
      return {
        minX: useZone.rightCm,
        minZ: useZone.frontCm,
        maxX: useZone.leftCm,
        maxZ: useZone.backCm,
      };
    case 270:
      return {
        minX: useZone.backCm,
        minZ: useZone.rightCm,
        maxX: useZone.frontCm,
        maxZ: useZone.leftCm,
      };
  }
}

export function createEquipmentFootprints(
  placement: Pick<Placement, "position" | "rotation">,
  product: ProductGeometryDescriptor,
): EquipmentFootprints {
  const physical = createRectangleFootprint(
    placement.position,
    product.dimensions,
    placement.rotation,
  );
  const insets = getRotatedUseZoneInsets(product.useZone, placement.rotation);
  const minX = physical.minX - insets.minX;
  const minZ = physical.minZ - insets.minZ;
  const maxX = physical.maxX + insets.maxX;
  const maxZ = physical.maxZ + insets.maxZ;

  return {
    physical,
    useZone: {
      minX,
      minZ,
      maxX,
      maxZ,
      widthCm: maxX - minX,
      depthCm: maxZ - minZ,
    },
  };
}
