import type { ClearanceMargins, Rotation } from "@/features/project/schemas/geometry";

import type { RectangleBounds, RectangleFootprint } from "./rectangles";

export type FootprintInsets = {
  readonly minX: number;
  readonly minZ: number;
  readonly maxX: number;
  readonly maxZ: number;
};

/** Maps object-local directional margins onto room axes. */
export function getRotatedDirectionalInsets(
  margins: ClearanceMargins,
  rotation: Rotation,
): FootprintInsets {
  switch (rotation) {
    case 0:
      return {
        minX: margins.leftCm,
        minZ: margins.backCm,
        maxX: margins.rightCm,
        maxZ: margins.frontCm,
      };
    case 90:
      return {
        minX: margins.frontCm,
        minZ: margins.leftCm,
        maxX: margins.backCm,
        maxZ: margins.rightCm,
      };
    case 180:
      return {
        minX: margins.rightCm,
        minZ: margins.frontCm,
        maxX: margins.leftCm,
        maxZ: margins.backCm,
      };
    case 270:
      return {
        minX: margins.backCm,
        minZ: margins.rightCm,
        maxX: margins.frontCm,
        maxZ: margins.leftCm,
      };
  }
}

export function expandFootprintByDirectionalMargins(
  physical: RectangleBounds,
  margins: ClearanceMargins,
  rotation: Rotation,
): RectangleFootprint {
  const insets = getRotatedDirectionalInsets(margins, rotation);
  const minX = physical.minX - insets.minX;
  const minZ = physical.minZ - insets.minZ;
  const maxX = physical.maxX + insets.maxX;
  const maxZ = physical.maxZ + insets.maxZ;
  return {
    minX,
    minZ,
    maxX,
    maxZ,
    widthCm: maxX - minX,
    depthCm: maxZ - minZ,
  };
}

export function hasDirectionalMargins(margins: ClearanceMargins): boolean {
  return margins.frontCm > 0 || margins.backCm > 0 || margins.leftCm > 0 || margins.rightCm > 0;
}
