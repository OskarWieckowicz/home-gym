import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createProjectStore } from "@/features/creator/store/project-store";
import { createDefaultProject } from "@/features/project/defaults";
import { placementPatchSchema } from "@/features/project/schemas/project-command";
import {
  createApplyLayoutChangesHandler,
  createEvaluateLayoutChangesHandler,
  createSuggestPlacementsHandler,
} from "./batch-tool-handlers";
import {
  createPlaceProductHandler,
  createRemoveProductHandler,
  createUnplaceProductHandler,
  createUpdatePlacementHandler,
} from "./placement-tool-handlers";
import { createGetProjectStateHandler } from "./room-tool-handlers";

const placementId = "placement_locked";
const projectItemId = "project-item_locked";
const unlock = { type: "PLACEMENT_UPDATED", payload: { placementId, patch: { locked: false } } };
const move = { type: "PLACEMENT_UPDATED", payload: { placementId, patch: { position: { xCm: 100, zCm: 0 } } } };

function lockedStore() {
  const store = createProjectStore(createDefaultProject(), { dependencies: {
    generatePlacementId: () => placementId,
    generateProjectItemId: () => projectItemId,
  } });
  expect(createPlaceProductHandler(store)({
    productId: "product_groundwork_exercise_mat", position: { xCm: 0, zCm: 0 }, rotation: 0,
  })).toMatchObject({ ok: true, placement: { locked: false } });
  expect(createUpdatePlacementHandler(store)({ placementId, patch: { locked: true } }))
    .toMatchObject({ ok: true, changed: true, placement: { locked: true } });
  return store;
}

describe("equipment locks through WebMCP", () => {
  it("exposes locks in reads and rejects agent movement, removal, unplacing and suggestions", () => {
    const store = lockedStore();
    const before = store.getState();
    expect(createGetProjectStateHandler(store)({})).toMatchObject({
      ok: true, project: { version: 5, placements: [{ id: placementId, locked: true }] },
    });
    for (const result of [
      createUpdatePlacementHandler(store)(move.payload),
      createUpdatePlacementHandler(store)({ placementId, patch: { locked: false, rotation: 90 } }),
      createUnplaceProductHandler(store)({ placementId }),
      createRemoveProductHandler(store)({ projectItemId }),
      createSuggestPlacementsHandler(store)({ projectItemId }),
    ]) {
      expect(result).toMatchObject({ ok: false, error: { code: "ENTITY_LOCKED" } });
    }
    expect(store.getState()).toBe(before);
  });

  it("previews an explicit unlock/move batch without publication and commits it as one undo step", () => {
    const store = lockedStore();
    const before = store.getState();
    expect(createEvaluateLayoutChangesHandler(store)({ changes: [unlock, move] }))
      .toMatchObject({ ok: true, applies: true });
    expect(store.getState()).toBe(before);
    expect(createApplyLayoutChangesHandler(store)({ changes: [unlock, move] }))
      .toMatchObject({ ok: true, changed: true, revision: before.revision + 1 });
    expect(store.getState().project.placements[0]).toMatchObject({ locked: false, position: { xCm: 100, zCm: 0 } });
    expect(store.getState().undo()).toBe(true);
    expect(store.getState().project).toEqual(before.project);
    expect(store.getState().redo()).toBe(true);
    expect(store.getState().project.placements[0].locked).toBe(false);
  });

  it("rejects evaluate/apply batches atomically when they attempt to move locked equipment", () => {
    const store = lockedStore();
    const before = store.getState();
    const changes = [{ type: "PROJECT_SETTINGS_UPDATED", payload: { budget: 20000 } }, move];
    for (const create of [createEvaluateLayoutChangesHandler, createApplyLayoutChangesHandler]) {
      expect(create(store)({ changes })).toMatchObject({ ok: false, index: 1, error: { code: "ENTITY_LOCKED" } });
      expect(store.getState()).toBe(before);
    }
  });

  it("uses a strict JSON-schema-compatible boolean lock patch", () => {
    expect(placementPatchSchema.parse({ locked: true })).toEqual({ locked: true });
    expect(placementPatchSchema.parse({ locked: false })).toEqual({ locked: false });
    for (const input of [{}, { locked: "true" }, { locked: false, ignoreLock: true }]) {
      expect(placementPatchSchema.safeParse(input).success).toBe(false);
    }
    expect(z.toJSONSchema(placementPatchSchema)).toHaveProperty("anyOf");
  });
});
