import { describe, expect, it } from "vitest";

import { createDefaultProject } from "@/features/project/defaults";
import type { GymProject } from "@/features/project/schemas/project";

import { createProjectStore } from "./project-store";

const obstacleInput = {
  kind: "obstacle",
  name: "Wardrobe",
  position: { xCm: 0, zCm: 0 },
  dimensions: { widthCm: 180, depthCm: 60, heightCm: 220 },
  rotation: 0,
  locked: false,
} as const;

function createStoreWithIds(initialProject: GymProject, ids: string[]) {
  let index = 0;
  return createProjectStore(initialProject, {
    dependencies: {
      generateObstacleId: () => ids[index++] ?? "obstacle_fallback",
    },
  });
}

describe("createProjectStore", () => {
  it("parses the initial project and computes initial validation once", () => {
    const input = {
      ...createDefaultProject(),
      obstacles: [
        {
          id: "obstacle_outside",
          ...obstacleInput,
          position: { xCm: 390, zCm: 0 },
        },
      ],
    };
    const store = createProjectStore(input);

    expect(store.getState()).toMatchObject({
      revision: 0,
      canUndo: false,
      canRedo: false,
      validation: [{ code: "OUTSIDE_ROOM", entityIds: ["obstacle_outside"] }],
    });
    expect(store.getState().project).not.toBe(input);
  });

  it("dispatches through the executor and snapshots each real change", () => {
    const store = createStoreWithIds(createDefaultProject(), ["obstacle_generated"]);
    const result = store.getState().dispatch({
      type: "OBSTACLE_ADDED",
      payload: obstacleInput,
    });

    expect(result).toMatchObject({
      ok: true,
      changed: true,
      revision: 1,
      affectedEntityIds: ["obstacle_generated"],
    });
    expect(store.getState()).toMatchObject({
      revision: 1,
      canUndo: true,
      canRedo: false,
    });
    expect(store.getState().project.obstacles[0].id).toBe("obstacle_generated");
  });

  it("does not record rejected commands or no-ops", () => {
    const store = createProjectStore(createDefaultProject());
    const rejected = store.getState().dispatch({
      type: "OBSTACLE_REMOVED",
      payload: { obstacleId: "obstacle_missing" },
    });
    const noOp = store.getState().dispatch({
      type: "ROOM_CONFIGURED",
      payload: { widthCm: 400, depthCm: 320, heightCm: 240 },
    });

    expect(rejected).toMatchObject({ ok: false, revision: 0 });
    expect(noOp).toMatchObject({ ok: true, changed: false, revision: 0 });
    expect(store.getState()).toMatchObject({
      revision: 0,
      canUndo: false,
      canRedo: false,
    });
    expect(store.getState().undo()).toBe(false);
  });

  it("undoes and redoes exact snapshots while advancing revision", () => {
    const store = createProjectStore(createDefaultProject());
    store.getState().dispatch({
      type: "PROJECT_SETTINGS_UPDATED",
      payload: { budget: 12_500, trainingGoals: ["strength"] },
    });
    const changedProject = store.getState().project;

    expect(store.getState().undo()).toBe(true);
    expect(store.getState()).toMatchObject({
      project: { budget: 10_000, trainingGoals: [] },
      revision: 2,
      canUndo: false,
      canRedo: true,
    });
    expect(store.getState().redo()).toBe(true);
    expect(store.getState().project).toEqual(changedProject);
    expect(store.getState().project).not.toBe(changedProject);
    expect(store.getState()).toMatchObject({
      revision: 3,
      canUndo: true,
      canRedo: false,
    });
    expect(store.getState().redo()).toBe(false);
    expect(store.getState().revision).toBe(3);
  });

  it("isolates private history from stale project references", () => {
    const store = createProjectStore(createDefaultProject());
    const staleProject = store.getState().project;
    store.getState().dispatch({
      type: "PROJECT_SETTINGS_UPDATED",
      payload: { budget: 12_500 },
    });

    staleProject.budget = 1;
    staleProject.room.widthCm = 1;
    staleProject.trainingGoals.push("strength");

    expect(store.getState().undo()).toBe(true);
    expect(store.getState().project).toMatchObject({
      budget: 10_000,
      room: { widthCm: 400 },
      trainingGoals: [],
    });
  });

  it("clears the redo branch after a new edit", () => {
    const store = createProjectStore(createDefaultProject());
    store.getState().dispatch({
      type: "PROJECT_SETTINGS_UPDATED",
      payload: { budget: 11_000 },
    });
    store.getState().dispatch({
      type: "PROJECT_SETTINGS_UPDATED",
      payload: { budget: 12_000 },
    });
    store.getState().undo();
    expect(store.getState().canRedo).toBe(true);

    store.getState().dispatch({
      type: "PROJECT_SETTINGS_UPDATED",
      payload: { budget: 13_000 },
    });
    expect(store.getState()).toMatchObject({
      project: { budget: 13_000 },
      canRedo: false,
    });
    expect(store.getState().redo()).toBe(false);
  });

  it("keeps only the 50 most recent past snapshots", () => {
    const store = createProjectStore(createDefaultProject());

    for (let widthCm = 401; widthCm <= 451; widthCm += 1) {
      store.getState().dispatch({
        type: "ROOM_CONFIGURED",
        payload: { widthCm, depthCm: 320, heightCm: 240 },
      });
    }
    for (let count = 0; count < 50; count += 1) {
      expect(store.getState().undo()).toBe(true);
    }

    expect(store.getState().project.room.widthCm).toBe(401);
    expect(store.getState().undo()).toBe(false);
    expect(store.getState().revision).toBe(101);
  });

  it("recomputes validation when navigating history", () => {
    const store = createStoreWithIds(createDefaultProject(), ["obstacle_generated"]);
    store.getState().dispatch({
      type: "OBSTACLE_ADDED",
      payload: { ...obstacleInput, position: { xCm: 390, zCm: 0 } },
    });
    expect(store.getState().validation).toHaveLength(1);

    store.getState().undo();
    expect(store.getState().validation).toEqual([]);
    store.getState().redo();
    expect(store.getState().validation).toMatchObject([
      { code: "OUTSIDE_ROOM", entityIds: ["obstacle_generated"] },
    ]);
  });
});

describe("project replacement", () => {
  it("replaces a project as one undoable revision and clears redo", () => {
    const store = createProjectStore(createDefaultProject());
    store.getState().dispatch({
      type: "PROJECT_SETTINGS_UPDATED",
      payload: { budget: 11_000 },
    });
    store.getState().undo();

    const imported = { ...createDefaultProject(), budget: 15_000 };
    expect(store.getState().replaceProject(imported)).toMatchObject({
      ok: true,
      changed: true,
      revision: 3,
    });
    expect(store.getState()).toMatchObject({
      project: { budget: 15_000 },
      canUndo: true,
      canRedo: false,
    });

    expect(store.getState().undo()).toBe(true);
    expect(store.getState().project.budget).toBe(10_000);
    expect(store.getState().redo()).toBe(true);
    expect(store.getState().project.budget).toBe(15_000);
  });

  it("does not replace, revise or add history for equal and invalid projects", () => {
    const store = createProjectStore(createDefaultProject());

    expect(store.getState().replaceProject(createDefaultProject())).toMatchObject({
      ok: true,
      changed: false,
      revision: 0,
    });
    expect(store.getState().replaceProject({ version: 1 })).toEqual({
      ok: false,
      changed: false,
      revision: 0,
      error: {
        code: "INVALID_PROJECT",
        message: "Project data is invalid.",
      },
    });
    expect(store.getState()).toMatchObject({
      revision: 0,
      canUndo: false,
      canRedo: false,
    });
  });

  it("recomputes validation for project replacement", () => {
    const store = createProjectStore(createDefaultProject());
    const invalidLayout = {
      ...createDefaultProject(),
      obstacles: [
        {
          id: "obstacle_outside",
          ...obstacleInput,
          position: { xCm: 390, zCm: 0 },
        },
      ],
    };

    const result = store.getState().replaceProject(invalidLayout);
    expect(result).toMatchObject({
      ok: true,
      issues: [{ code: "OUTSIDE_ROOM", entityIds: ["obstacle_outside"] }],
    });
    expect(store.getState().validation).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "OUTSIDE_ROOM" })]),
    );
  });
});
