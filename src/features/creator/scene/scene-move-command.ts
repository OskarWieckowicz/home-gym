import { getEffectiveMounting } from "@/features/catalog/queries/catalog";
import { getRotatedFootprintDimensions } from "@/features/geometry/rectangles";
import { constrainMountedDrag, getMountedWall } from "@/features/geometry/wall-mounting";
import type { Position } from "@/features/project/schemas/geometry";
import type { GymProject, Placement } from "@/features/project/schemas/project";
import type { ProjectCommand } from "@/features/project/schemas/project-command";

import { productForPlacement } from "../placement-product";

export type SceneMoveResult =
  | { readonly ok: true; readonly command: ProjectCommand | null }
  | { readonly ok: false; readonly error: string };

function movedPosition(start: Position, delta: Position): Position {
  return { xCm: Math.max(0, start.xCm + delta.xCm), zCm: Math.max(0, start.zCm + delta.zCm) };
}

function samePosition(first: Position, second: Position): boolean {
  return first.xCm === second.xCm && first.zCm === second.zCm;
}

function movePlacement(project: GymProject, placement: Placement, delta: Position): SceneMoveResult {
  const product = productForPlacement(project, placement);
  if (!product) return { ok: false, error: "This catalog product is unavailable." };
  let position = movedPosition(placement.position, delta);
  if (getEffectiveMounting(product).kind === "wall") {
    const dimensions = getRotatedFootprintDimensions(product.dimensions, placement.rotation);
    const wall = getMountedWall(placement.rotation);
    // Project onto the retained mounting wall BEFORE applying the flush-position constraint.
    if (wall === "top" || wall === "bottom") {
      position.zCm = wall === "top" ? 0 : project.room.depthCm - dimensions.depthCm;
    } else {
      position.xCm = wall === "left" ? 0 : project.room.widthCm - dimensions.widthCm;
    }
    const constrained = constrainMountedDrag(position, placement.rotation, product.dimensions, project.room);
    if (!constrained) return { ok: false, error: "This equipment footprint does not fit on its wall." };
    position = constrained;
  }
  return { ok: true, command: samePosition(position, placement.position) ? null : {
    type: "PLACEMENT_UPDATED", payload: { placementId: placement.id, patch: { position } },
  } };
}

/** Snap pointer deltas, preserving both the grab offset and any existing off-grid position. */
export function createSceneMoveCommand(
  project: GymProject,
  entityId: string,
  startPointer: Position,
  nextPointer: Position,
): SceneMoveResult {
  if (![startPointer.xCm, startPointer.zCm, nextPointer.xCm, nextPointer.zCm].every(Number.isFinite)) {
    return { ok: false, error: "The pointer target is unavailable." };
  }
  const delta = {
    xCm: Math.round((nextPointer.xCm - startPointer.xCm) / 10) * 10,
    zCm: Math.round((nextPointer.zCm - startPointer.zCm) / 10) * 10,
  };
  const obstacle = project.obstacles.find((candidate) => candidate.id === entityId);
  if (obstacle) {
    if (obstacle.locked) return { ok: false, error: "This area is locked. Unlock it in the inspector to move it." };
    const position = movedPosition(obstacle.position, delta);
    return { ok: true, command: samePosition(position, obstacle.position) ? null : {
      type: "OBSTACLE_UPDATED", payload: { obstacleId: obstacle.id, patch: { position } },
    } };
  }
  const placement = project.placements.find((candidate) => candidate.id === entityId);
  if (placement) return movePlacement(project, placement, delta);
  const element = project.wallElements.find((candidate) => candidate.id === entityId);
  if (!element) return { ok: false, error: "This project element is unavailable." };
  const horizontal = element.wall === "top" || element.wall === "bottom";
  const maximum = (horizontal ? project.room.widthCm : project.room.depthCm) - element.widthCm;
  if (maximum < 0) return { ok: false, error: "This wall element does not fit on its wall." };
  const offsetCm = Math.min(maximum, Math.max(0, element.offsetCm + (horizontal ? delta.xCm : delta.zCm)));
  return { ok: true, command: offsetCm === element.offsetCm ? null : {
    type: "WALL_ELEMENT_UPDATED", payload: { wallElementId: element.id, patch: { offsetCm } },
  } };
}
