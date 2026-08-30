import { describe, expect, it } from "vitest";

import { findProductById } from "@/features/catalog/queries/catalog";
import { createProjectStore } from "@/features/creator/store/project-store";
import { createDefaultProject } from "@/features/project/defaults";

import {
  createPlaceProductHandler,
  createRemoveProductHandler,
  createUpdatePlacementHandler,
} from "./placement-tool-handlers";

const productId = "product_northstar_half_rack";

function createStore() {
  return createProjectStore(createDefaultProject(), {
    dependencies: { generatePlacementId: () => "placement_agent-rack" },
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
      placementId: "placement_agent-rack",
      placement: { id: "placement_agent-rack", productId },
      validation: { issueCount: expect.any(Number) },
    });
    expect(store.getState().canUndo).toBe(true);

    const updated = createUpdatePlacementHandler(store)({
      placementId: "placement_agent-rack",
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
      placementId: "placement_agent-rack",
      patch: { rotation: 90 },
    });
    expect(unchanged).toMatchObject({ ok: true, changed: false, revision: 2 });

    const removed = createRemoveProductHandler(store)({
      placementId: "placement_agent-rack",
    });
    expect(removed).toMatchObject({
      ok: true,
      tool: "remove_product",
      changed: true,
      revision: 3,
      removedPlacementId: "placement_agent-rack",
      removedProductId: productId,
    });
    expect(store.getState().project.placements).toEqual([]);
    expect(store.getState().undo()).toBe(true);
    expect(store.getState().project.placements).toHaveLength(1);
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
        placementId: "placement_agent-rack",
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
    const unknownPlacement = createRemoveProductHandler(store)({
      placementId: "placement_unknown",
    });
    expect(unknownPlacement).toMatchObject({
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
      dependencies: { generatePlacementId: () => "placement_agent-bar" },
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
        issueCounts: { wallMountOffWall: 1 },
        issues: [{
          code: "WALL_MOUNT_OFF_WALL",
          details: { wall: "right", gapCm: 46 },
        }],
      },
    });
  });
});
