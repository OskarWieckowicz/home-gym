import { describe, expect, it, vi } from "vitest";

import {
  createProjectStore,
  type ProjectStore,
} from "@/features/creator/store/project-store";
import { createDefaultProject } from "@/features/project/defaults";
import type { GymProject } from "@/features/project/schemas/project";

import {
  createAddObstacleHandler,
  createAddWallElementHandler,
  createConfigureRoomHandler,
  createGetProjectStateHandler,
  createRemoveObstacleHandler,
  createRemoveWallElementHandler,
  createUpdateObstacleHandler,
  createUpdateWallElementHandler,
  createUpdateProjectSettingsHandler,
  createValidateLayoutHandler,
} from "./room-tool-handlers";

const obstacleInput = {
  kind: "obstacle",
  name: "Column",
  position: { xCm: 390, zCm: 0 },
  dimensions: { widthCm: 30, depthCm: 30, heightCm: 220 },
  rotation: 0,
  locked: false,
} as const;

function createStore(initialProject: GymProject = createDefaultProject()) {
  return createProjectStore(initialProject, {
    dependencies: {
      generateObstacleId: () => "obstacle_generated",
      generateWallElementId: () => "wall-element_generated",
    },
  });
}

describe("room read handlers", () => {
  it("reads live state after handler creation and returns detached plain data", () => {
    const store = createStore();
    const handler = createGetProjectStateHandler(store);
    store.getState().dispatch({
      type: "PROJECT_SETTINGS_UPDATED",
      payload: { budget: 12_500, trainingGoals: ["strength"] },
    });

    const result = handler({});
    expect(result).toMatchObject({
      ok: true,
      tool: "get_project_state",
      revision: 1,
      canUndo: true,
      canRedo: false,
      project: {
        version: 2,
        wallElements: [],
        budget: 12_500,
        trainingGoals: ["strength"],
      },
      validation: { valid: true, issueCount: 0, issues: [] },
    });
    if (!result.ok) throw new Error("Expected successful state read.");
    result.project.room.widthCm = 1;
    result.project.trainingGoals.push("mobility");
    expect(store.getState().project).toMatchObject({
      room: { widthCm: 400 },
      trainingGoals: ["strength"],
    });
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  it("returns deterministic cloned validation without changing history", () => {
    const store = createStore();
    createAddObstacleHandler(store)(obstacleInput);
    const before = store.getState();
    const result = createValidateLayoutHandler(store)({});

    expect(result).toMatchObject({
      ok: true,
      tool: "validate_layout",
      revision: 1,
      valid: false,
      issueCount: 1,
      issueCounts: { outsideRoom: 1 },
      issues: [{ code: "OUTSIDE_ROOM", entityIds: ["obstacle_generated"] }],
    });
    expect(store.getState()).toMatchObject({
      revision: before.revision,
      canUndo: before.canUndo,
      canRedo: before.canRedo,
    });
    if (!result.ok) throw new Error("Expected successful validation read.");
    const returnedIssue = result.issues[0];
    const storedIssue = store.getState().validation[0];
    if (returnedIssue.code !== "OUTSIDE_ROOM" || storedIssue.code !== "OUTSIDE_ROOM") {
      throw new Error("Expected outside-room issues.");
    }
    (returnedIssue.details.footprint as { minX: number }).minX = 0;
    expect(storedIssue.details.footprint.minX).toBe(390);
  });

  it("serializes height, physical collision, unavailable-zone and multi-issue states", () => {
    const base = createDefaultProject();
    const store = createStore({
      ...base,
      obstacles: [
        {
          id: "obstacle_tall",
          kind: "obstacle",
          name: "Tall rack",
          position: { xCm: 0, zCm: 0 },
          dimensions: { widthCm: 100, depthCm: 100, heightCm: 250 },
          rotation: 0,
          locked: false,
        },
        {
          id: "obstacle_bench",
          kind: "obstacle",
          name: "Bench",
          position: { xCm: 50, zCm: 50 },
          dimensions: { widthCm: 100, depthCm: 100, heightCm: 100 },
          rotation: 0,
          locked: false,
        },
        {
          id: "obstacle_door_zone",
          kind: "unavailable-zone",
          name: "Door swing",
          position: { xCm: 75, zCm: 75 },
          dimensions: { widthCm: 25, depthCm: 25 },
          rotation: 0,
          locked: false,
        },
      ],
    });

    const result = createValidateLayoutHandler(store)({});
    expect(result).toMatchObject({
      ok: true,
      valid: false,
      issueCount: 4,
      issueCounts: {
        outsideRoom: 1,
        physicalCollision: 1,
        unavailableZoneConflict: 2,
        outsideWall: 0,
        wallElementOverlap: 0,
      },
    });
    if (!result.ok) throw new Error("Expected successful validation read.");
    expect(result.issues.map(({ code }) => code)).toEqual([
      "UNAVAILABLE_ZONE_CONFLICT",
      "PHYSICAL_COLLISION",
      "UNAVAILABLE_ZONE_CONFLICT",
      "OUTSIDE_ROOM",
    ]);
    const outside = result.issues.find(({ code }) => code === "OUTSIDE_ROOM");
    expect(outside).toMatchObject({ details: { axes: ["height"] } });
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  it("rejects extra read input and handles cancellation without reading the store", () => {
    const getState = vi.fn(() => {
      throw new Error("must not read");
    });
    const store = { getState } as unknown as ProjectStore;
    const controller = new AbortController();
    controller.abort();

    expect(createGetProjectStateHandler(store)({ extra: true })).toMatchObject({
      ok: false,
      error: { code: "INVALID_INPUT" },
    });
    expect(createValidateLayoutHandler(store)({}, { signal: controller.signal })).toMatchObject({
      ok: false,
      error: { code: "EXECUTION_FAILED", message: "Tool execution was cancelled." },
    });
    expect(getState).not.toHaveBeenCalled();
  });
});

describe("room mutation handlers", () => {
  it("dispatches one canonical room command and reports no-ops without history", () => {
    const store = createStore();
    const result = createConfigureRoomHandler(store)({
      widthCm: 400,
      depthCm: 320,
      heightCm: 240,
    });

    expect(result).toMatchObject({
      ok: true,
      tool: "configure_room",
      changed: false,
      revision: 0,
      affectedEntityIds: [],
      room: { widthCm: 400, depthCm: 320, heightCm: 240 },
    });
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
  });

  it("updates settings through one undoable command", () => {
    const store = createStore();
    const dispatch = vi.spyOn(store.getState(), "dispatch");

    const result = createUpdateProjectSettingsHandler(store)({
      budget: 15_000,
      trainingGoals: ["strength", "mobility"],
    });

    expect(dispatch).toHaveBeenCalledOnce();
    expect(dispatch).toHaveBeenCalledWith({
      type: "PROJECT_SETTINGS_UPDATED",
      payload: { budget: 15_000, trainingGoals: ["strength", "mobility"] },
    });
    expect(result).toMatchObject({
      ok: true,
      changed: true,
      revision: 1,
      settings: { budget: 15_000, trainingGoals: ["strength", "mobility"] },
    });
    expect(store.getState().undo()).toBe(true);
    expect(store.getState().project.budget).toBe(10_000);
  });

  it("adds, updates, and removes the executor-generated canonical obstacle", () => {
    const store = createStore();
    const dispatch = vi.spyOn(store.getState(), "dispatch");
    const added = createAddObstacleHandler(store)(obstacleInput);
    expect(added).toMatchObject({
      ok: true,
      revision: 1,
      obstacleId: "obstacle_generated",
      obstacle: { id: "obstacle_generated", name: "Column" },
      validation: { valid: false, issueCount: 1 },
    });

    const updated = createUpdateObstacleHandler(store)({
      obstacleId: "obstacle_generated",
      patch: { position: { xCm: 100, zCm: 100 }, name: "Support column" },
    });
    expect(updated).toMatchObject({
      ok: true,
      revision: 2,
      obstacle: {
        id: "obstacle_generated",
        name: "Support column",
        position: { xCm: 100, zCm: 100 },
      },
      validation: { valid: true },
    });

    const removed = createRemoveObstacleHandler(store)({
      obstacleId: "obstacle_generated",
    });
    expect(removed).toMatchObject({
      ok: true,
      revision: 3,
      removedObstacleId: "obstacle_generated",
      affectedEntityIds: ["obstacle_generated"],
    });
    expect(store.getState().project.obstacles).toEqual([]);
    expect(dispatch).toHaveBeenCalledTimes(3);
  });

  it("rejects dimension updates incompatible with the target obstacle kind", () => {
    const physicalProject: GymProject = {
      ...createDefaultProject(),
      obstacles: [{ id: "obstacle_physical", ...obstacleInput }],
    };
    const physicalStore = createStore(physicalProject);
    expect(createUpdateObstacleHandler(physicalStore)({
      obstacleId: "obstacle_physical",
      patch: { dimensions: { widthCm: 40, depthCm: 40 } },
    })).toMatchObject({
      ok: false,
      error: {
        code: "INVALID_COMMAND",
        message: "Obstacle dimensions do not match the target obstacle kind.",
      },
    });
    expect(physicalStore.getState()).toMatchObject({ revision: 0, canUndo: false });

    const zoneProject: GymProject = {
      ...createDefaultProject(),
      obstacles: [{
        id: "obstacle_zone",
        kind: "unavailable-zone",
        name: "Access zone",
        position: { xCm: 0, zCm: 0 },
        dimensions: { widthCm: 100, depthCm: 80 },
        rotation: 0,
        locked: false,
      }],
    };
    const zoneStore = createStore(zoneProject);
    expect(createUpdateObstacleHandler(zoneStore)({
      obstacleId: "obstacle_zone",
      patch: { dimensions: { widthCm: 100, depthCm: 80, heightCm: 200 } },
    })).toMatchObject({ ok: false, error: { code: "INVALID_COMMAND" } });
    expect(zoneStore.getState()).toMatchObject({ revision: 0, canUndo: false });
  });
});

describe("wall element WebMCP handlers", () => {
  it("adds, updates, and removes a wall element without creating an unavailable zone", () => {
    const store = createStore();
    const dispatch = vi.spyOn(store.getState(), "dispatch");
    const added = createAddWallElementHandler(store)({
      kind: "door",
      name: "Main door",
      wall: "top",
      offsetCm: 350,
      widthCm: 90,
    });

    expect(added).toMatchObject({
      ok: true,
      revision: 1,
      wallElementId: "wall-element_generated",
      wallElement: {
        id: "wall-element_generated",
        kind: "door",
        wall: "top",
      },
      validation: {
        valid: false,
        issueCounts: { outsideWall: 1, wallElementOverlap: 0 },
      },
    });
    expect(store.getState().project.obstacles).toEqual([]);

    const updated = createUpdateWallElementHandler(store)({
      wallElementId: "wall-element_generated",
      patch: { kind: "window" },
    });
    expect(updated).toMatchObject({
      ok: false,
      error: { code: "INVALID_INPUT" },
    });
    expect(dispatch).toHaveBeenCalledOnce();

    expect(
      createUpdateWallElementHandler(store)({
        wallElementId: "wall-element_generated",
        patch: { offsetCm: 200, widthCm: 100, name: "Side door" },
      }),
    ).toMatchObject({
      ok: true,
      revision: 2,
      wallElement: { name: "Side door", offsetCm: 200, widthCm: 100 },
      validation: { valid: true },
    });
    expect(
      createRemoveWallElementHandler(store)({
        wallElementId: "wall-element_generated",
      }),
    ).toMatchObject({
      ok: true,
      revision: 3,
      removedWallElementId: "wall-element_generated",
    });
    expect(store.getState().project.wallElements).toEqual([]);
    expect(store.getState().project.obstacles).toEqual([]);
    expect(dispatch).toHaveBeenCalledTimes(3);
  });

  it("serializes wall bounds and overlap validation as detached data", () => {
    const base = createDefaultProject();
    const store = createStore({
      ...base,
      wallElements: [
        {
          id: "wall-element_door",
          kind: "door",
          name: "Door",
          wall: "top",
          offsetCm: 350,
          widthCm: 90,
        },
        {
          id: "wall-element_window",
          kind: "window",
          name: "Window",
          wall: "top",
          offsetCm: 360,
          widthCm: 30,
        },
      ],
    });

    const result = createValidateLayoutHandler(store)({});
    expect(result).toMatchObject({
      ok: true,
      valid: false,
      issueCount: 2,
      issueCounts: { outsideWall: 1, wallElementOverlap: 1 },
      issues: [
        { code: "OUTSIDE_WALL" },
        { code: "WALL_ELEMENT_OVERLAP" },
      ],
    });
    if (!result.ok) throw new Error("Expected successful validation read.");
    const overlap = result.issues.find(
      ({ code }) => code === "WALL_ELEMENT_OVERLAP",
    );
    const stored = store.getState().validation.find(
      ({ code }) => code === "WALL_ELEMENT_OVERLAP",
    );
    if (overlap?.code !== "WALL_ELEMENT_OVERLAP" || stored?.code !== "WALL_ELEMENT_OVERLAP") {
      throw new Error("Expected wall-element overlap issues.");
    }
    (overlap.details.overlap as { startCm: number }).startCm = 0;
    expect(stored.details.overlap.startCm).toBe(360);
  });
});

describe("room mutation handler failures", () => {
  it("passes through locked and not-found domain failures without history", () => {
    const project = {
      ...createDefaultProject(),
      obstacles: [
        {
          id: "obstacle_locked",
          ...obstacleInput,
          position: { xCm: 0, zCm: 0 },
          locked: true,
        },
      ],
    } satisfies GymProject;
    const store = createStore(project);

    expect(
      createUpdateObstacleHandler(store)({
        obstacleId: "obstacle_locked",
        patch: { name: "Renamed" },
      }),
    ).toEqual({
      ok: false,
      tool: "update_obstacle",
      error: {
        code: "ENTITY_LOCKED",
        message: "The obstacle is locked. Unlock it before making other changes.",
      },
    });
    expect(
      createRemoveObstacleHandler(store)({ obstacleId: "obstacle_missing" }),
    ).toMatchObject({ ok: false, error: { code: "ENTITY_NOT_FOUND" } });
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });

    expect(
      createUpdateObstacleHandler(store)({
        obstacleId: "obstacle_locked",
        patch: { locked: false },
      }),
    ).toMatchObject({ ok: true, changed: true, obstacle: { locked: false } });
  });

  it("does not dispatch invalid or cancelled mutations", () => {
    const store = createStore();
    const dispatch = vi.spyOn(store.getState(), "dispatch");
    const controller = new AbortController();
    controller.abort();

    expect(createUpdateProjectSettingsHandler(store)({})).toMatchObject({
      ok: false,
      error: { code: "INVALID_INPUT" },
    });
    expect(
      createAddObstacleHandler(store)(obstacleInput, { signal: controller.signal }),
    ).toMatchObject({ ok: false, error: { code: "EXECUTION_FAILED" } });
    expect(dispatch).not.toHaveBeenCalled();
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
  });

  it("redacts unexpected store and dispatch failures", () => {
    const getFailure = {
      getState: () => {
        throw new Error("private store details");
      },
    } as unknown as ProjectStore;
    const result = createConfigureRoomHandler(getFailure)({
      widthCm: 500,
      depthCm: 400,
      heightCm: 250,
    });

    expect(result).toEqual({
      ok: false,
      tool: "configure_room",
      error: {
        code: "EXECUTION_FAILED",
        message: "Room configuration could not be applied.",
      },
    });
    expect(JSON.stringify(result)).not.toContain("private");
  });
});
