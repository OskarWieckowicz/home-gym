import type { GymProject } from "@/features/project/schemas/project";
import type { ProjectCommand } from "@/features/project/schemas/project-command";

import type { PlacementTool } from "../editor-types";
import { centerFloorRectangle, centerWallElement, type PlacementTarget } from "./placement-target";

export const FLOOR_DEFAULTS = {
  obstacle: { name: "Physical obstacle", dimensions: { widthCm: 100, depthCm: 50, heightCm: 200 } },
  "unavailable-zone": { name: "Unavailable zone", dimensions: { widthCm: 100, depthCm: 100 } },
} as const;
export const WALL_DEFAULTS = {
  door: { name: "Door", widthCm: 90 },
  window: { name: "Window", widthCm: 120 },
} as const;

export type PlacementCommandResult =
  | { readonly ok: true; readonly command: ProjectCommand }
  | { readonly ok: false; readonly error: string };

export function createRoomElementCommand(
  tool: PlacementTool,
  target: PlacementTarget,
  project: GymProject,
): PlacementCommandResult {
  if (tool === "obstacle" || tool === "unavailable-zone") {
    if (target.kind !== "floor") return { ok: false, error: "Place this area inside the room." };
    const defaults = FLOOR_DEFAULTS[tool];
    const position = centerFloorRectangle(target.position, defaults.dimensions, project.room);
    if (!position) return { ok: false, error: "The default area does not fit in this room." };
    if (tool === "obstacle") {
      return {
        ok: true,
        command: {
          type: "OBSTACLE_ADDED",
          payload: {
            kind: tool,
            name: defaults.name,
            position,
            dimensions: FLOOR_DEFAULTS.obstacle.dimensions,
            functionalClearance: {
              frontCm: 0,
              backCm: 0,
              leftCm: 0,
              rightCm: 0,
            },
            rotation: 0,
            locked: false,
          },
        },
      };
    }
    return {
      ok: true,
      command: {
        type: "OBSTACLE_ADDED",
        payload: {
          kind: tool,
          name: defaults.name,
          position,
          dimensions: FLOOR_DEFAULTS["unavailable-zone"].dimensions,
          rotation: 0,
          locked: false,
        },
      },
    };
  }

  if (target.kind !== "wall") {
    return { ok: false, error: "Place doors and windows on a room wall." };
  }
  const defaults = WALL_DEFAULTS[tool];
  const wallLength = target.wall === "top" || target.wall === "bottom"
    ? project.room.widthCm
    : project.room.depthCm;
  const offsetCm = centerWallElement(target.offsetCm, defaults.widthCm, wallLength);
  if (offsetCm === null) {
    return { ok: false, error: "The default wall element does not fit on this wall." };
  }
  return {
    ok: true,
    command: {
      type: "WALL_ELEMENT_ADDED",
      payload: {
        kind: tool,
        name: defaults.name,
        wall: target.wall,
        offsetCm,
        widthCm: defaults.widthCm,
      },
    },
  };
}
