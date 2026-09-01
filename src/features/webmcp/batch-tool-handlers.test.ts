import { describe, expect, it } from "vitest";

import { createProjectStore } from "@/features/creator/store/project-store";
import { createDefaultProject } from "@/features/project/defaults";

import { createSuggestPlacementsHandler } from "./batch-tool-handlers";

const productId = "product_groundwork_exercise_mat";
const request = {
  productId,
  rotations: [0],
  region: { minXCm: 0, minZCm: 0, maxXCm: 30, maxZCm: 0 },
};

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
    const store = createProjectStore({
      ...createDefaultProject(),
      room: { widthCm: 50, depthCm: 50, heightCm: 240 },
    });
    const result = createSuggestPlacementsHandler(store)({ productId, rotations: [0] });
    expect(result).toMatchObject({
      ok: true,
      candidates: [],
      rejectedCount: 36,
      rejectionReasons: { OUTSIDE_ROOM: 36 },
    });
  });

  it("validates reference alternatives, limits, missing entities and pre-aborted calls", () => {
    const handler = createSuggestPlacementsHandler(createProjectStore(createDefaultProject()));
    for (const input of [
      {},
      { ...request, projectItemId: "project-item_test" },
      { ...request, limit: 11 },
      { ...request, rotations: [45] },
    ]) {
      expect(handler(input)).toMatchObject({
        ok: false,
        error: { code: "INVALID_INPUT", issues: expect.any(Array) },
      });
    }
    expect(handler({ productId: "product_missing" })).toMatchObject({
      ok: false,
      error: { code: "ENTITY_NOT_FOUND" },
    });
    expect(handler({ productId: "product_groundwork_foam_roller" })).toMatchObject({
      ok: false,
      error: { code: "INVALID_COMMAND" },
    });
    expect(handler(request, { signal: AbortSignal.abort() })).toMatchObject({
      ok: false,
      error: { code: "EXECUTION_FAILED" },
    });
  });
});
