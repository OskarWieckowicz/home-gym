import { describe, expect, it } from "vitest";

import { createDefaultProject } from "../defaults";
import type { GymProject, WallElement } from "../schemas/project";
import { applyProjectCommand } from "./apply-project-command";
import { EMPTY_ACCESS_IMPACT } from "../validation/access-impact";

function door(id: string, wall: WallElement["wall"], offsetCm: number): WallElement {
  return { id, kind: "door", name: id, wall, offsetCm, widthCm: 90 };
}

function twoDoorRoom(): GymProject {
  return {
    ...createDefaultProject(),
    room: { widthCm: 400, depthCm: 400, heightCm: 250 },
    wallElements: [
      door("wall-element_front", "top", 150),
      door("wall-element_back", "bottom", 150),
    ],
  };
}

const bar = {
  kind: "obstacle" as const,
  name: "Bar",
  position: { xCm: 0, zCm: 160 },
  dimensions: { widthCm: 400, depthCm: 80, heightCm: 200 },
  functionalClearance: { frontCm: 0, backCm: 0, leftCm: 0, rightCm: 0 },
  rotation: 0 as const,
  locked: false,
};

describe("access impact", () => {
  it("names entities a placement or obstacle made unreachable and restores them on remove", () => {
    const added = applyProjectCommand(
      twoDoorRoom(),
      { type: "OBSTACLE_ADDED", payload: bar },
      { generateObstacleId: () => "obstacle_bar" },
    );
    expect(added.result).toMatchObject({
      ok: true,
      changed: true,
      accessImpact: {
        madeUnreachable: [
          { entityId: "wall-element_back", reason: "DOOR_UNREACHABLE" },
          { entityId: "wall-element_front", reason: "DOOR_UNREACHABLE" },
        ],
        restored: [],
      },
    });

    const removed = applyProjectCommand(
      added.project,
      { type: "OBSTACLE_REMOVED", payload: { obstacleId: "obstacle_bar" } },
    );
    expect(removed.result).toMatchObject({
      ok: true,
      accessImpact: {
        madeUnreachable: [],
        restored: [
          { entityId: "wall-element_back", reason: "DOOR_UNREACHABLE" },
          { entityId: "wall-element_front", reason: "DOOR_UNREACHABLE" },
        ],
      },
    });
  });

  it("returns an empty impact for a no-op and omits impact on failure", () => {
    const project = twoDoorRoom();
    const noOp = applyProjectCommand(project, {
      type: "ROOM_CONFIGURED",
      payload: project.room,
    });
    expect(noOp.result).toMatchObject({
      ok: true,
      changed: false,
      accessImpact: EMPTY_ACCESS_IMPACT,
    });

    const failed = applyProjectCommand(project, {
      type: "OBSTACLE_REMOVED",
      payload: { obstacleId: "obstacle_missing" },
    });
    expect(failed.result.ok).toBe(false);
    expect(failed.result).not.toHaveProperty("accessImpact");
  });
});
