import { describe, expect, it } from "vitest";

import { findProductById } from "@/features/catalog/queries/catalog";
import { createProjectStore } from "@/features/creator/store/project-store";
import { createDefaultProject } from "@/features/project/defaults";

import {
  createAddProductToProjectHandler,
  createPlaceProductHandler,
  createPlaceProjectItemHandler,
  createRemoveProductHandler,
  createUnplaceProductHandler,
  createUpdatePlacementHandler,
} from "./placement-tool-handlers";
import { createValidateLayoutHandler } from "./room-tool-handlers";

const productId = "product_northstar_half_rack";
const itemId = "project-item_agent-rack";
const placementId = "placement_agent-rack";

function createStore() {
  return createProjectStore(createDefaultProject(), {
    dependencies: {
      generatePlacementId: () => placementId,
      generateProjectItemId: () => itemId,
    },
  });
}

describe("placement WebMCP handlers", () => {
  it("places, updates and removes through the shared store and undo history", () => {
    const store = createStore();
    const placed = createPlaceProductHandler(store)({
      productId,
      position: { xCm: 10, zCm: 20 },
      rotation: 0,
    });
    expect(placed).toMatchObject({
      ok: true,
      tool: "place_product",
      changed: true,
      revision: 1,
      placementId,
      projectItemId: itemId,
      placement: { id: placementId, productId, projectItemId: itemId },
      validation: { issueCount: expect.any(Number) },
    });
    expect(store.getState().canUndo).toBe(true);

    const updated = createUpdatePlacementHandler(store)({
      placementId,
      patch: { position: { xCm: 240, zCm: 40 }, rotation: 90 },
    });
    expect(updated).toMatchObject({
      ok: true,
      tool: "update_placement",
      changed: true,
      revision: 2,
      placement: { position: { xCm: 240, zCm: 40 }, rotation: 90 },
    });

    const unchanged = createUpdatePlacementHandler(store)({
      placementId,
      patch: { rotation: 90 },
    });
    expect(unchanged).toMatchObject({ ok: true, changed: false, revision: 2 });

    const removed = createRemoveProductHandler(store)({
      projectItemId: itemId,
    });
    expect(removed).toMatchObject({
      ok: true,
      tool: "remove_product",
      changed: true,
      revision: 3,
      removedProjectItemId: itemId,
      removedPlacementId: placementId,
      removedProductId: productId,
      cascade: { projectItemId: itemId, placementIds: [placementId] },
    });
    expect(store.getState().project.placements).toEqual([]);
    expect(store.getState().project.projectItems).toEqual([]);
    expect(store.getState().undo()).toBe(true);
    expect(store.getState().project.placements).toHaveLength(1);
    expect(store.getState().project.projectItems).toHaveLength(1);
  });

  it("adds an unplaced item, places it later, and unplaces without deleting it", () => {
    const store = createStore();
    const added = createAddProductToProjectHandler(store)({ productId });
    expect(added).toMatchObject({
      ok: true,
      tool: "add_product_to_project",
      projectItemId: itemId,
      item: { id: itemId, productId, placed: false },
    });
    expect(store.getState().project.placements).toEqual([]);

    const placed = createPlaceProjectItemHandler(store)({
      projectItemId: itemId,
      position: { xCm: 40, zCm: 50 },
      rotation: 90,
    });
    expect(placed).toMatchObject({
      ok: true,
      tool: "place_project_item",
      placementId,
      projectItemId: itemId,
      item: { placed: true, placementId },
    });

    const unplaced = createUnplaceProductHandler(store)({ placementId });
    expect(unplaced).toMatchObject({
      ok: true,
      tool: "unplace_product",
      unplacedPlacementId: placementId,
      projectItemId: itemId,
      item: { placed: false, placementId: null },
    });
    expect(store.getState().project.placements).toEqual([]);
    expect(store.getState().project.projectItems).toEqual([
      { id: itemId, productId },
    ]);
  });

  it("rejects selection-only floor placement without mutating", () => {
    const store = createStore();
    const rejected = createPlaceProductHandler(store)({
      productId: "product_groundwork_foam_roller",
      position: { xCm: 10, zCm: 20 },
      rotation: 0,
    });
    expect(rejected).toMatchObject({
      ok: false,
      error: {
        code: "INVALID_COMMAND",
        message: "This product cannot be placed on the floor.",
      },
    });
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });

    const added = createAddProductToProjectHandler(store)({
      productId: "product_groundwork_foam_roller",
    });
    expect(added).toMatchObject({
      ok: true,
      item: { placementMode: "selection-only", placed: false },
    });
    expect(
      createPlaceProjectItemHandler(store)({
        projectItemId: itemId,
        position: { xCm: 10, zCm: 20 },
        rotation: 0,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: "INVALID_COMMAND" },
    });
    expect(store.getState().project.placements).toEqual([]);
  });

  it("returns stable errors without mutating for invalid or unknown entities", () => {
    const store = createStore();
    const invalid = createPlaceProductHandler(store)({
      productId,
      position: { xCm: -1, zCm: 0 },
      rotation: 0,
    });
    expect(invalid).toMatchObject({
      ok: false,
      error: { code: "INVALID_INPUT", issues: expect.any(Array) },
    });
    expect(
      createUpdatePlacementHandler(store)({
        placementId,
        patch: null,
      }),
    ).toMatchObject({
      ok: false,
      error: {
        code: "INVALID_INPUT",
        issues: [
          { path: "patch", message: "Patch must contain at least one supported field." },
        ],
      },
    });

    const unknownProduct = createPlaceProductHandler(store)({
      productId: "product_unknown_item",
      position: { xCm: 0, zCm: 0 },
      rotation: 0,
    });
    expect(unknownProduct).toMatchObject({
      ok: false,
      error: { code: "ENTITY_NOT_FOUND" },
    });
    const unknownItem = createRemoveProductHandler(store)({
      projectItemId: "project-item_unknown",
    });
    expect(unknownItem).toMatchObject({
      ok: false,
      error: { code: "ENTITY_NOT_FOUND" },
    });
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
  });

  it("honors cancellation before parsing or dispatch", () => {
    const store = createStore();
    const controller = new AbortController();
    controller.abort();
    expect(
      createPlaceProductHandler(store)(null, { signal: controller.signal }),
    ).toMatchObject({
      ok: false,
      tool: "place_product",
      error: { code: "EXECUTION_FAILED", message: expect.stringContaining("cancelled") },
    });
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
  });

  it("does not turn a successful custom-resolver mutation into a tool failure", () => {
    const baseProduct = findProductById(productId);
    if (!baseProduct) throw new Error("Missing catalog fixture.");
    const customProduct = { ...baseProduct, id: "product_custom_rack" };
    const store = createProjectStore(createDefaultProject(), {
      dependencies: {
        generatePlacementId: () => "placement_custom",
        generateProjectItemId: () => "project-item_custom",
        resolveProduct: (id) => id === customProduct.id ? customProduct : undefined,
      },
    });

    expect(
      createPlaceProductHandler(store)({
        productId: customProduct.id,
        position: { xCm: 80, zCm: 80 },
        rotation: 0,
      }),
    ).toMatchObject({
      ok: true,
      placement: { id: "placement_custom", productId: customProduct.id },
    });
    expect(store.getState().project.placements).toHaveLength(1);
  });

  it("returns WALL_MOUNT_OFF_WALL with the derived wall and gap for an off-wall agent placement", () => {
    const store = createProjectStore({
      ...createDefaultProject(),
      room: { widthCm: 300, depthCm: 400, heightCm: 250 },
      wallElements: [{
        id: "wall-element_door",
        kind: "door",
        name: "Door",
        wall: "top",
        offsetCm: 20,
        widthCm: 90,
      }],
    }, {
      dependencies: {
        generatePlacementId: () => "placement_agent-bar",
        generateProjectItemId: () => "project-item_agent-bar",
      },
    });

    const placed = createPlaceProductHandler(store)({
      productId: "product_anchor_pullup_bar",
      position: { xCm: 200, zCm: 80 },
      rotation: 90,
    });
    expect(placed).toMatchObject({
      ok: true,
      placement: {
        id: "placement_agent-bar",
        mounting: { kind: "wall", bottomHeightCm: 195 },
      },
      validation: {
        valid: false,
        errorCount: 1,
        errorCodes: ["WALL_MOUNT_OFF_WALL"],
        affectedIssues: [{
          code: "WALL_MOUNT_OFF_WALL",
          entityIds: ["placement_agent-bar"],
          details: { wall: "right", gapCm: 46 },
        }],
      },
    });
    const validation = createValidateLayoutHandler(store)({});
    expect(validation).toMatchObject({
      issueCounts: { wallMountOffWall: 1 },
      issues: [{
        code: "WALL_MOUNT_OFF_WALL",
        details: { wall: "right", gapCm: 46 },
      }],
    });
    if (!placed || !validation || !placed.ok || !validation.ok || !("validation" in placed)) {
      throw new Error("Expected successful tool results.");
    }
    expect(placed.validation.affectedIssues[0]).toEqual(validation.issues[0]);
  });

  it("accepts exact non-grid wall snaps through every placement mutation", () => {
    const room = { widthCm: 400, depthCm: 600, heightCm: 250 };
    const newStore = () => createProjectStore({ ...createDefaultProject(), room }, {
      dependencies: {
        generatePlacementId: () => "placement_wall",
        generateProjectItemId: () => "project-item_wall",
      },
    });

    const productStore = newStore();
    expect(createPlaceProductHandler(productStore)({
      productId: "product_anchor_pullup_bar",
      position: { xCm: 346, zCm: 140 },
      rotation: 90,
    })).toMatchObject({
      ok: true,
      placement: { position: { xCm: 346, zCm: 140 }, rotation: 90 },
      validation: { errorCodes: [] },
    });

    const itemStore = newStore();
    expect(createAddProductToProjectHandler(itemStore)({
      productId: "product_anchor_pullup_bar",
    })).toMatchObject({ ok: true, projectItemId: "project-item_wall" });
    expect(createPlaceProjectItemHandler(itemStore)({
      projectItemId: "project-item_wall",
      position: { xCm: 140, zCm: 546 },
      rotation: 180,
    })).toMatchObject({
      ok: true,
      placement: { position: { xCm: 140, zCm: 546 }, rotation: 180 },
      validation: { errorCodes: [] },
    });

    const updateStore = newStore();
    createPlaceProductHandler(updateStore)({
      productId: "product_anchor_pullup_bar",
      position: { xCm: 140, zCm: 0 },
      rotation: 0,
    });
    expect(createUpdatePlacementHandler(updateStore)({
      placementId: "placement_wall",
      patch: { position: { xCm: 346, zCm: 140 }, rotation: 90 },
    })).toMatchObject({
      ok: true,
      placement: { position: { xCm: 346, zCm: 140 }, rotation: 90 },
      validation: { errorCodes: [] },
    });
  });
});
