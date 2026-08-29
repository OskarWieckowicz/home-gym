import { describe, expect, it } from "vitest";

import { createDefaultProject, projectCommandSchema } from "@/features/project";

import { createProjectStore } from "./project-store";

describe("shared room editing scenario", () => {
  it("uses the same dispatch history for configuration, correction, locks, undo, and redo", () => {
    const ids = ["obstacle_wardrobe", "obstacle_door_zone"];
    const store = createProjectStore(createDefaultProject(), {
      dependencies: { generateObstacleId: () => ids.shift() ?? "obstacle_fallback" },
    });
    const dispatch = (command: unknown) =>
      store.getState().dispatch(projectCommandSchema.parse(command));

    dispatch({
      type: "ROOM_CONFIGURED",
      payload: { widthCm: 400, depthCm: 320, heightCm: 250 },
    });
    dispatch({
      type: "PROJECT_SETTINGS_UPDATED",
      payload: {
        budget: 10_000,
        trainingGoals: ["strength", "conditioning"],
      },
    });
    const wardrobe = dispatch({
      type: "OBSTACLE_ADDED",
      payload: {
        kind: "obstacle",
        name: "Wardrobe",
        position: { xCm: 0, zCm: 0 },
        dimensions: { widthCm: 180, depthCm: 60, heightCm: 220 },
        rotation: 0,
        locked: true,
      },
    });
    expect(wardrobe).toMatchObject({
      ok: true,
      affectedEntityIds: ["obstacle_wardrobe"],
    });

    const conflicted = dispatch({
      type: "OBSTACLE_ADDED",
      payload: {
        kind: "unavailable-zone",
        name: "Door swing",
        position: { xCm: 150, zCm: 0 },
        dimensions: { widthCm: 90, depthCm: 90 },
        rotation: 0,
        locked: false,
      },
    });
    expect(conflicted).toMatchObject({
      ok: true,
      changed: true,
      affectedEntityIds: ["obstacle_door_zone"],
      issues: [
        {
          code: "UNAVAILABLE_ZONE_CONFLICT",
          entityIds: ["obstacle_door_zone", "obstacle_wardrobe"],
        },
      ],
    });

    const corrected = dispatch({
      type: "OBSTACLE_UPDATED",
      payload: {
        obstacleId: "obstacle_door_zone",
        patch: { position: { xCm: 200, zCm: 0 } },
      },
    });
    expect(corrected).toMatchObject({ ok: true, changed: true, issues: [] });
    expect(store.getState().validation.issues).toEqual([]);

    expect(store.getState().undo()).toBe(true);
    expect(store.getState().validation.issues).toMatchObject([
      { code: "UNAVAILABLE_ZONE_CONFLICT" },
    ]);
    expect(store.getState().redo()).toBe(true);
    expect(store.getState().validation.issues).toEqual([]);

    const lockedMove = dispatch({
      type: "OBSTACLE_UPDATED",
      payload: {
        obstacleId: "obstacle_wardrobe",
        patch: { position: { xCm: 10, zCm: 0 } },
      },
    });
    expect(lockedMove).toMatchObject({
      ok: false,
      error: { code: "ENTITY_LOCKED" },
    });

    const lockedRemove = dispatch({
      type: "OBSTACLE_REMOVED",
      payload: { obstacleId: "obstacle_wardrobe" },
    });
    expect(lockedRemove).toMatchObject({
      ok: false,
      error: { code: "ENTITY_LOCKED" },
    });

    expect(
      dispatch({
        type: "OBSTACLE_UPDATED",
        payload: {
          obstacleId: "obstacle_wardrobe",
          patch: { locked: false },
        },
      }),
    ).toMatchObject({ ok: true, changed: true });
    expect(
      dispatch({
        type: "OBSTACLE_UPDATED",
        payload: {
          obstacleId: "obstacle_wardrobe",
          patch: { position: { xCm: 10, zCm: 0 } },
        },
      }),
    ).toMatchObject({ ok: true, changed: true });

    expect(store.getState().project).toMatchObject({
      room: { widthCm: 400, depthCm: 320, heightCm: 250 },
      budget: 10_000,
      trainingGoals: ["strength", "conditioning"],
      obstacles: [
        { id: "obstacle_wardrobe", locked: false, position: { xCm: 10, zCm: 0 } },
        { id: "obstacle_door_zone", position: { xCm: 200, zCm: 0 } },
      ],
    });
  });
});
