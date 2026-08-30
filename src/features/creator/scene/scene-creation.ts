import type { GymProject } from "@/features/project/schemas/project";
import type { PlacementTool } from "../editor-types";
import type { PlacementTarget } from "../plan/placement-target";
import { createRoomElementCommand } from "../plan/create-room-element-command";
import { createPlaceProductCommand, createPlaceProjectItemCommand, type PlaceEquipmentResult } from "../plan/place-equipment";

export type SceneCreation = {
  readonly activeTool: PlacementTool | null;
  readonly activeProductId: string | null;
  readonly activeProjectItemId: string | null;
};

export function createSceneCreationCommand(mode: SceneCreation, target: PlacementTarget, project: GymProject): PlaceEquipmentResult {
  if (mode.activeTool) return createRoomElementCommand(mode.activeTool, target, project);
  if (mode.activeProductId) return createPlaceProductCommand(mode.activeProductId, target, project);
  const item = project.projectItems.find((item) => item.id === mode.activeProjectItemId);
  if (!item) return { ok: false, error: "This project item is unavailable." };
  if (project.placements.some((placement) => placement.projectItemId === item.id)) {
    return { ok: false, error: "This project item is already placed." };
  }
  return createPlaceProjectItemCommand(item.id, item.productId, target, project);
}
