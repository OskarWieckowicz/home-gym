import { describe, expect, it, vi } from "vitest";

import { createDefaultProject } from "@/features/project/defaults";
import { analyzeProject, createProjectAnalysis } from "@/features/project/validation/analyze-project";

import { createProjectStore } from "./project-store";

const obstacle = {
  kind: "obstacle",
  name: "Small cabinet",
  dimensions: { widthCm: 30, depthCm: 30, heightCm: 100 },
  functionalClearance: { frontCm: 0, backCm: 0, leftCm: 0, rightCm: 0 },
  rotation: 0,
  locked: false,
} as const;

describe("project store batch commands", () => {
  it("commits four placements in one notification, revision, and undo step", () => {
    let obstacleIndex = 0;
    const store = createProjectStore(createDefaultProject(), {
      dependencies: { generateObstacleId: () => `obstacle_${++obstacleIndex}` },
    });
    const original = store.getState().project;
    const subscriber = vi.fn();
    store.subscribe(subscriber);
    const result = store.getState().dispatchBatch([0, 1, 2, 3].map((index) => ({
      type: "OBSTACLE_ADDED",
      payload: { ...obstacle, position: { xCm: index * 80, zCm: 100 } },
    })));
    const final = store.getState().project;
    expect(result).toMatchObject({ ok: true, changed: true, revision: 1 });
    expect(final.obstacles).toHaveLength(4);
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(store.getState().undo()).toBe(true);
    expect(store.getState().project).toEqual(original);
    expect(store.getState().undo()).toBe(false);
    expect(store.getState().redo()).toBe(true);
    expect(store.getState().project).toEqual(final);
  });

  it("does not publish intermediate changes or disturb redo on command rejection", () => {
    const store = createProjectStore(createDefaultProject());
    store.getState().dispatch({ type: "PROJECT_SETTINGS_UPDATED", payload: { budget: 15_000 } });
    store.getState().undo();
    const before = store.getState();
    const subscriber = vi.fn();
    store.subscribe(subscriber);
    expect(store.getState().dispatchBatch([
      { type: "PROJECT_SETTINGS_UPDATED", payload: { budget: 12_000 } },
      { type: "PROJECT_SETTINGS_UPDATED", payload: { trainingGoals: ["strength"] } },
      { type: "OBSTACLE_REMOVED", payload: { obstacleId: "obstacle_missing" } },
    ])).toMatchObject({ ok: false, revision: before.revision, error: { index: 2 } });
    expect(store.getState()).toBe(before);
    expect(subscriber).not.toHaveBeenCalled();
    expect(store.getState().redo()).toBe(true);
  });

  it("does not create history for an exact or net no-op", () => {
    const store = createProjectStore(createDefaultProject());
    const before = store.getState();
    for (const budgets of [[2_500], [12_000, 2_500]]) {
      expect(store.getState().dispatchBatch(budgets.map((budget) => ({
        type: "PROJECT_SETTINGS_UPDATED", payload: { budget },
      })))).toMatchObject({ ok: true, changed: false, revision: 0 });
    }
    expect(store.getState()).toBe(before);
    expect(store.getState().undo()).toBe(false);
  });

  it("rejects invalid final analysis without committing, while accepting temporary errors", () => {
    const store = createProjectStore(createDefaultProject(), {
      dependencies: { generateObstacleId: () => "obstacle_new" },
    });
    const before = store.getState();
    const add = {
      type: "OBSTACLE_ADDED",
      payload: { ...obstacle, position: { xCm: 900, zCm: 100 } },
    };
    expect(store.getState().dispatchBatch([add])).toMatchObject({
      ok: false,
      error: { code: "INVALID_COMMAND", index: null },
      analysis: { valid: false },
    });
    expect(store.getState()).toBe(before);
    expect(store.getState().dispatchBatch([add, {
      type: "OBSTACLE_UPDATED",
      payload: { obstacleId: "obstacle_new", patch: { position: { xCm: 100, zCm: 100 } } },
    }])).toMatchObject({ ok: true, revision: 1 });
  });

  it("rejects unreachable facts even when global validation contains only a warning", () => {
    const store = createProjectStore(createDefaultProject(), {
      dependencies: {
        analyzeProject: () => createProjectAnalysis([{
          code: "OBSTACLE_UNREACHABLE", severity: "warning", entityIds: ["obstacle_x"], details: {},
        }], {
          evaluated: true, reason: null,
          facts: [{ entityId: "obstacle_x", kind: "obstacle", state: "unreachable" }],
        }),
      },
    });
    expect(store.getState().dispatchBatch([{
      type: "PROJECT_SETTINGS_UPDATED", payload: { budget: 12_000 },
    }])).toMatchObject({ ok: false, analysis: { valid: true, warningCount: 1 } });
    expect(store.getState().revision).toBe(0);
    expect(store.getState().canUndo).toBe(false);
  });

  it("previews purely using the same custom analyzer without consuming IDs", () => {
    const generateObstacleId = vi.fn(() => "obstacle_real");
    const analyze = vi.fn(analyzeProject);
    const store = createProjectStore(createDefaultProject(), {
      dependencies: { generateObstacleId, analyzeProject: analyze },
    });
    const before = store.getState();
    const commands = [{
      type: "OBSTACLE_ADDED", payload: { ...obstacle, position: { xCm: 100, zCm: 100 } },
    }];
    const first = store.getState().previewBatch(commands);
    expect(first.result).toMatchObject({ ok: true, changed: true });
    expect(store.getState().previewBatch(commands)).toEqual(first);
    expect(generateObstacleId).not.toHaveBeenCalled();
    expect(analyze).toHaveBeenCalledWith(first.project);
    expect(store.getState()).toBe(before);
    expect(store.getState().dispatchBatch(commands)).toMatchObject({
      ok: true, affectedEntityIds: ["obstacle_real"], revision: 1,
    });
    expect(generateObstacleId).toHaveBeenCalledTimes(1);
  });
});
