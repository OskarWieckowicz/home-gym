import { getEffectiveMounting } from "@/features/catalog/queries/catalog";
import type { GymProject, Room, WallElement } from "@/features/project/schemas/project";
import { productForPlacement } from "../placement-product";
import {
  equipmentBoxToScene, obstacleToScene, WALL_OPENING_INSET_M, wallElementRotation, wallElementToScene,
  type SceneBox,
} from "./scene-transform";

/** Include the visible frame/handle around the door or window's domain width. */
function wallOpeningBox(element: WallElement, room: Room): SceneBox {
  const position = wallElementToScene(element, room);
  const rotationY = wallElementRotation(element);
  const inset = WALL_OPENING_INSET_M + 0.03;
  const isDoor = element.kind === "door";
  return {
    position: {
      x: position.x + Math.sin(rotationY) * inset,
      y: position.y + (isDoor ? -0.15 : 0.3),
      z: position.z + Math.cos(rotationY) * inset,
    },
    dimensions: { x: element.widthCm / 100 + 0.12, y: isDoor ? 2.22 : 1.16, z: 0.12 },
    rotationY,
  };
}

/** Snapshot a selected entity's presentation envelope without requiring loaded GLBs. */
export function sceneSelectionBox(project: GymProject, selectedId: string | null): SceneBox | null {
  if (!selectedId) return null;
  const obstacle = project.obstacles.find(({ id }) => id === selectedId);
  if (obstacle) return obstacleToScene(obstacle, project.room);
  const opening = project.wallElements.find(({ id }) => id === selectedId);
  if (opening) return wallOpeningBox(opening, project.room);
  const placement = project.placements.find(({ id }) => id === selectedId);
  if (!placement) return null;
  const product = productForPlacement(project, placement);
  if (!product) return null;
  const mounting = getEffectiveMounting(product);
  return equipmentBoxToScene(placement, product.dimensions, project.room,
    mounting.kind === "wall" ? mounting.bottomHeightCm : 0);
}
