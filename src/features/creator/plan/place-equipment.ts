import { findProductById, getEffectiveMounting } from "@/features/catalog/queries/catalog";
import { findProjectProductById } from "@/features/catalog/queries/project-products";
import { snapWallMountedPlacement } from "@/features/geometry/wall-mounting";
import type { ProjectCommand } from "@/features/project/schemas/project-command";
import type { GymProject } from "@/features/project/schemas/project";

import { centerFloorRectangle, type PlacementTarget } from "./placement-target";

export type PlaceEquipmentResult =
  | { readonly ok: true; readonly command: ProjectCommand }
  | { readonly ok: false; readonly error: string };

export function createPlaceProductCommand(
  productId: string,
  target: PlacementTarget,
  project: GymProject,
): PlaceEquipmentResult {
  if (!findProductById(productId)) return { ok: false, error: "This catalog product is unavailable." };
  return createFloorPlacementCommand(productId, target, project, (product, position, rotation) => ({
    type: "PRODUCT_PLACED",
    payload: { productId: product.id, position, rotation },
  }));
}

export function createPlaceProjectItemCommand(
  projectItemId: string,
  productId: string,
  target: PlacementTarget,
  project: GymProject,
): PlaceEquipmentResult {
  return createFloorPlacementCommand(productId, target, project, (product, position, rotation) => ({
    type: "PROJECT_ITEM_PLACED",
    payload: { projectItemId, position, rotation },
  }));
}

function createFloorPlacementCommand(
  productId: string,
  target: PlacementTarget,
  project: GymProject,
  commandFor: (
    product: NonNullable<ReturnType<typeof findProjectProductById>>,
    position: { xCm: number; zCm: number },
    rotation: 0 | 90 | 180 | 270,
  ) => ProjectCommand,
): PlaceEquipmentResult {
  if (target.kind !== "floor") {
    return { ok: false, error: "Place equipment inside the room." };
  }
  const product = findProjectProductById(productId);
  if (!product) {
    return { ok: false, error: "This catalog product is unavailable." };
  }
  if (product.placementMode === "selection-only") {
    return { ok: false, error: "This product cannot be placed on the floor." };
  }
  if (getEffectiveMounting(product).kind === "wall") {
    const snapped = snapWallMountedPlacement(target.position, product.dimensions, project.room);
    if (!snapped) {
      return { ok: false, error: "This equipment footprint does not fit on a wall in the room." };
    }
    return { ok: true, command: commandFor(product, snapped.position, snapped.rotation) };
  }
  const position = centerFloorRectangle(target.position, product.dimensions, project.room);
  if (!position) {
    return { ok: false, error: "This equipment footprint does not fit in the room." };
  }
  return { ok: true, command: commandFor(product, position, 0) };
}
