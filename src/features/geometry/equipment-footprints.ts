import type { Placement } from "@/features/project/schemas/project";

import {
  createRectangleFootprint,
  type RectangleFootprint,
} from "./rectangles";

export type ProductClearance = {
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
  readonly clearance: ProductClearance;
};

export type EquipmentFootprints = {
  readonly physical: RectangleFootprint;
  readonly clearance: RectangleFootprint;
};

type FootprintInsets = {
  readonly minX: number;
  readonly minZ: number;
  readonly maxX: number;
  readonly maxZ: number;
};

function getRotatedClearanceInsets(
  clearance: ProductClearance,
  rotation: Placement["rotation"],
): FootprintInsets {
  switch (rotation) {
    case 0:
      return {
        minX: clearance.leftCm,
        minZ: clearance.backCm,
        maxX: clearance.rightCm,
        maxZ: clearance.frontCm,
      };
    case 90:
      return {
        minX: clearance.frontCm,
        minZ: clearance.leftCm,
        maxX: clearance.backCm,
        maxZ: clearance.rightCm,
      };
    case 180:
      return {
        minX: clearance.rightCm,
        minZ: clearance.frontCm,
        maxX: clearance.leftCm,
        maxZ: clearance.backCm,
      };
    case 270:
      return {
        minX: clearance.backCm,
        minZ: clearance.rightCm,
        maxX: clearance.frontCm,
        maxZ: clearance.leftCm,
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
  const insets = getRotatedClearanceInsets(product.clearance, placement.rotation);
  const minX = physical.minX - insets.minX;
  const minZ = physical.minZ - insets.minZ;
  const maxX = physical.maxX + insets.maxX;
  const maxZ = physical.maxZ + insets.maxZ;

  return {
    physical,
    clearance: {
      minX,
      minZ,
      maxX,
      maxZ,
      widthCm: maxX - minX,
      depthCm: maxZ - minZ,
    },
  };
}

