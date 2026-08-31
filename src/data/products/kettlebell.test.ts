import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { getProductImage } from "@/features/catalog/product-assets";
import { findProductBySlug, searchProducts } from "@/features/catalog/queries/catalog";
import { createProjectStore } from "@/features/creator/store/project-store";
import { createDefaultProject } from "@/features/project/defaults";

const productId = "product_forge_kettlebell_16kg";

describe("Forge Kettlebell 16 kg", () => {
  it("exposes one 16 kg product and distinguishes storage from exercise space", () => {
    const product = findProductBySlug("forge-kettlebell-16kg");
    expect(product).toMatchObject({
      id: productId,
      name: "Forge Kettlebell 16 kg",
      weightKg: 16,
      price: 299,
      category: "free-weights",
      placementMode: "floor",
      dimensions: { widthCm: 21, depthCm: 18, heightCm: 28 },
      useZone: { frontCm: 30, backCm: 30, leftCm: 30, rightCm: 30 },
    });
    expect(product?.constraints).toContain("Sold individually, not as a pair or set.");
    expect(product?.constraints).toContain(
      "The footprint and access margins describe storage only; they do not validate exercise clearance for swings or carries.",
    );
    const image = getProductImage(productId);
    expect(image).toBe("/assets/forge-kettlebell-16kg-catalog.png");
    expect(existsSync(join(process.cwd(), "public", image!))).toBe(true);
  });

  it("is discoverable through shared name, exercise, goal, and price filters", () => {
    expect(searchProducts({ query: "kettlebell", maxPrice: 299 })).toEqual([
      expect.objectContaining({ id: productId }),
    ]);
    expect(searchProducts({ exercise: "kettlebell swing", trainingGoal: "conditioning" })).toEqual([
      expect.objectContaining({ id: productId }),
    ]);
    expect(searchProducts({ query: "kettlebell", maxPrice: 298 })).toEqual([]);
  });

  it("places one unit, accounts for its price, and preserves shared undo/redo", () => {
    const store = createProjectStore({ ...createDefaultProject(), budget: 298 }, {
      dependencies: {
        generatePlacementId: () => "placement_kettlebell",
        generateProjectItemId: () => "project-item_kettlebell",
      },
    });
    const result = store.getState().dispatch({
      type: "PRODUCT_PLACED",
      payload: { productId, position: { xCm: 100, zCm: 100 }, rotation: 0 },
    });
    expect(result).toMatchObject({ ok: true, changed: true });
    expect(store.getState().project.projectItems).toEqual([
      { id: "project-item_kettlebell", productId },
    ]);
    expect(store.getState().project.placements).toHaveLength(1);
    expect(store.getState().validation.issues).toContainEqual(expect.objectContaining({
      details: { budget: 298, totalPrice: 299, excess: 1 },
    }));
    expect(store.getState().undo()).toBe(true);
    expect(store.getState().project.projectItems).toHaveLength(0);
    expect(store.getState().redo()).toBe(true);
    expect(store.getState().project.placements).toHaveLength(1);
    expect(store.getState().dispatch({
      type: "PLACEMENT_REMOVED",
      payload: { placementId: "placement_kettlebell" },
    })).toMatchObject({ ok: true });
    expect(store.getState().project.placements).toHaveLength(0);
    expect(store.getState().project.projectItems).toHaveLength(1);
    expect(store.getState().validation.issues).toContainEqual(expect.objectContaining({
      details: { budget: 298, totalPrice: 299, excess: 1 },
    }));
  });
});
