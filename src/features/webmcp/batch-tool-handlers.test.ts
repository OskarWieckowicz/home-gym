import { describe, expect, it, vi } from "vitest";

import { createProjectStore } from "@/features/creator/store/project-store";
import { createDefaultProject } from "@/features/project/defaults";
import { createProjectAnalysis } from "@/features/project/validation/project-analysis";

import {
  createApplyLayoutChangesHandler,
  createEvaluateLayoutChangesHandler,
  createSuggestPlacementsHandler,
} from "./batch-tool-handlers";

const productId = "product_groundwork_exercise_mat";
const changes = [0, 80, 160, 240].map((xCm) => ({
  type: "PRODUCT_PLACED",
  payload: { productId, position: { xCm, zCm: 0 }, rotation: 0 },
}));
const request = {
  productId,
  rotations: [0],
  region: { minXCm: 0, minZCm: 0, maxXCm: 30, maxZCm: 0 },
};

describe("layout batch tools", () => {
  it("evaluates without publishing state or consuming the real ID generators, then applies four placements with one undo", () => {
    let id = 0;
    const generatePlacementId = vi.fn(() => `placement_batch_${++id}`);
    const store = createProjectStore(createDefaultProject(), { dependencies: {
      generatePlacementId,
      generateProjectItemId: () => `project-item_batch_${++id}`,
    } });
    const before = store.getState();
    const subscriber = vi.fn();
    store.subscribe(subscriber);
    const evaluated = createEvaluateLayoutChangesHandler(store)({ changes });
    expect(evaluated).toMatchObject({
      ok: true, applies: true, revision: 0, index: null,
      validation: { valid: true, errorCount: 0, warningCount: 1 },
      delta: { errorCount: 0, warningCount: 0 },
    });
    expect(store.getState()).toBe(before);
    expect(generatePlacementId).not.toHaveBeenCalled();
    expect(subscriber).not.toHaveBeenCalled();

    const applied = createApplyLayoutChangesHandler(store)({ changes });
    expect(applied).toMatchObject({
      ok: true, changed: true, revision: 1,
      affectedEntityIds: expect.any(Array),
      accessImpact: { madeUnreachable: [], restored: [] },
      validation: { valid: true, warningCount: 1 },
      outcomes: changes.map((_, index) => ({ index, changed: true, commandType: "PRODUCT_PLACED" })),
    });
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(store.getState().project.placements).toHaveLength(4);
    expect(store.getState().undo()).toBe(true);
    expect(store.getState().project).toEqual(before.project);
    expect(store.getState().canUndo).toBe(false);
  });

  it("reports a third-command domain failure and never commits a partial batch", () => {
    const store = createProjectStore(createDefaultProject());
    const before = store.getState();
    const input = { changes: [...changes.slice(0, 2), {
      type: "PLACEMENT_REMOVED", payload: { placementId: "placement_missing" },
    }] };
    for (const create of [createEvaluateLayoutChangesHandler, createApplyLayoutChangesHandler]) {
      expect(create(store)(input)).toMatchObject({
        ok: false, applies: false, index: 2, commandType: "PLACEMENT_REMOVED",
        error: { code: "ENTITY_NOT_FOUND" },
      });
      expect(store.getState()).toBe(before);
    }
  });

  it("rejects final layout errors in evaluate and apply but allows a batch to fix an intermediate collision", () => {
    const store = createProjectStore(createDefaultProject());
    const duplicate = { changes: [changes[0], changes[0]] };
    expect(createEvaluateLayoutChangesHandler(store)(duplicate)).toMatchObject({
      ok: true, applies: false, reasons: expect.arrayContaining(["PHYSICAL_COLLISION"]),
      validation: { valid: false }, delta: { errorCount: 1 },
    });
    expect(createApplyLayoutChangesHandler(store)(duplicate)).toMatchObject({
      ok: false, applies: false, validation: { valid: false },
    });
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
    const placed = store.getState().dispatch(changes[0]);
    if (!placed.ok) throw new Error("Fixture placement failed");
    const input = { changes: [changes[0], {
      type: "PLACEMENT_REMOVED", payload: { placementId: placed.affectedEntityIds[0] },
    }] };
    expect(createApplyLayoutChangesHandler(store)(input)).toMatchObject({ ok: true });
    expect(store.getState().project.placements).toHaveLength(1);
  });

  it("does not let later commands target guessed temporary preview IDs", () => {
    const store = createProjectStore(createDefaultProject());
    const input = { changes: [changes[0], {
      type: "PLACEMENT_UPDATED",
      payload: { placementId: "placement_preview_2", patch: { rotation: 180 } },
    }] };
    for (const create of [createEvaluateLayoutChangesHandler, createApplyLayoutChangesHandler]) {
      expect(create(store)(input)).toMatchObject({
        ok: false, applies: false, index: 1, error: { code: "ENTITY_NOT_FOUND" },
      });
    }
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
  });

  it("rejects unreachable facts even when global validation has no errors", () => {
    const store = createProjectStore(createDefaultProject(), { dependencies: {
      analyzeProject: () => createProjectAnalysis([], {
        evaluated: true, reason: null,
        facts: [{ entityId: "obstacle_test", kind: "obstacle", state: "unreachable" }],
      }),
    } });
    expect(createEvaluateLayoutChangesHandler(store)({ changes })).toMatchObject({
      applies: false, validation: { valid: true }, reasons: ["ACCESS_UNREACHABLE"],
    });
    expect(createApplyLayoutChangesHandler(store)({ changes })).toMatchObject({ ok: false });
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
  });

  it("maps malformed inputs, batch limits, and cancellation into existing error envelopes", () => {
    const store = createProjectStore(createDefaultProject());
    for (const create of [createEvaluateLayoutChangesHandler, createApplyLayoutChangesHandler]) {
      const handler = create(store);
      for (const input of [{ changes: [] }, { changes: Array(26).fill(changes[0]) },
        { changes: [{ ...changes[0], payload: { ...changes[0].payload, rotation: 45 } }] },
        { changes, extra: true }]) {
        expect(handler(input)).toMatchObject({ ok: false, error: { code: "INVALID_INPUT", issues: expect.any(Array) } });
      }
      expect(handler({ changes }, { signal: AbortSignal.abort() })).toMatchObject({
        ok: false, error: { code: "EXECUTION_FAILED", message: "Tool execution was cancelled." },
      });
    }
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
  });
});

describe("suggest placements tool", () => {
  it("returns byte-identical suggestions across calls and fresh stores without changing state", () => {
    const project = createDefaultProject();
    const store = createProjectStore(project);
    const before = store.getState();
    const handler = createSuggestPlacementsHandler(store);
    const result = handler(request);
    expect(result).toMatchObject({ ok: true, revision: 0, generatedCount: 4, rejectedCount: 0 });
    expect(JSON.stringify(handler(request))).toBe(JSON.stringify(result));
    expect(JSON.stringify(createSuggestPlacementsHandler(createProjectStore(project))(request)))
      .toBe(JSON.stringify(result));
    expect(store.getState()).toBe(before);
  });

  it("returns an empty ranked list and rejection evidence when equipment cannot fit", () => {
    const store = createProjectStore({ ...createDefaultProject(), room: { widthCm: 50, depthCm: 50, heightCm: 240 } });
    const result = createSuggestPlacementsHandler(store)({ productId, rotations: [0] });
    expect(result).toMatchObject({ ok: true, candidates: [], rejectedCount: 36,
      rejectionReasons: { OUTSIDE_ROOM: 36 } });
  });

  it("validates reference alternatives, limits, missing entities and pre-aborted calls", () => {
    const handler = createSuggestPlacementsHandler(createProjectStore(createDefaultProject()));
    for (const input of [{}, { ...request, projectItemId: "project-item_test" },
      { ...request, limit: 11 }, { ...request, rotations: [45] }]) {
      expect(handler(input)).toMatchObject({ ok: false, error: { code: "INVALID_INPUT", issues: expect.any(Array) } });
    }
    expect(handler({ productId: "product_missing" })).toMatchObject({ ok: false, error: { code: "ENTITY_NOT_FOUND" } });
    expect(handler({ productId: "product_cove_wrist_wraps" })).toMatchObject({ ok: false, error: { code: "INVALID_COMMAND" } });
    expect(handler(request, { signal: AbortSignal.abort() })).toMatchObject({ ok: false, error: { code: "EXECUTION_FAILED" } });
  });
});
