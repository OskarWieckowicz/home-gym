import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { getProductImage } from "@/features/catalog/product-assets";
import { findProductBySlug, searchProducts } from "@/features/catalog/queries/catalog";
import { createProjectStore } from "@/features/creator/store/project-store";
import { createDefaultProject } from "@/features/project/defaults";
import { getVisualAsset } from "@/features/creator/scene/visual-assets";

describe("standalone Groundwork products", () => {
  it("maps the deployed mat model and top view without changing its floor footprint", () => {
    const product = findProductBySlug("groundwork-exercise-mat")!;
    const visual = getVisualAsset(product.id)!;
    expect(visual.envelopeCm).toEqual(product.dimensions);
    expect(visual.scale).toEqual([1, 1, 1]);
    expect(visual.src).toBe("/assets/groundwork-exercise-mat.glb");
    expect(visual.topViewSrc).toBe("/assets/groundwork-exercise-mat-top.svg");
    expect(product.mounting).toBeUndefined();
    expect(product.useZone).toEqual({ frontCm: 0, backCm: 0, leftCm: 0, rightCm: 0 });
    for (const path of [visual.src, visual.topViewSrc!]) {
      expect(existsSync(join(process.cwd(), "public", path)), path).toBe(true);
    }
  });

  it.each([
    ["groundwork-foam-roller", "selection-only", 22, { widthCm: 33, depthCm: 14, heightCm: 14 }],
    ["groundwork-exercise-mat", "floor", 32, { widthCm: 65, depthCm: 180, heightCm: 1 }],
  ])("exposes %s with its own image, price and placement mode", (slug, placementMode, price, dimensions) => {
    const product = findProductBySlug(slug as string)!;
    expect(product).toMatchObject({ placementMode, price, dimensions });
    expect(searchProducts({ query: product.name, trainingGoal: "mobility" })).toContainEqual(product);
    const image = getProductImage(product.id)!;
    expect(image).toBe(`/assets/${slug}-catalog.png`);
    expect(existsSync(join(process.cwd(), "public", image))).toBe(true);
  });

  it("allows shopping-list roller selection, rejects roller placement, and places the unfolded mat", () => {
    const store = createProjectStore({ ...createDefaultProject(), budget: 53 });
    expect(store.getState().dispatch({
      type: "PRODUCT_PLACED",
      payload: { productId: "product_groundwork_foam_roller", position: { xCm: 100, zCm: 70 }, rotation: 0 },
    })).toMatchObject({ ok: false });
    expect(store.getState().project.projectItems).toHaveLength(0);

    expect(store.getState().dispatch({
      type: "PROJECT_ITEM_ADDED",
      payload: { productId: "product_groundwork_foam_roller" },
    })).toMatchObject({ ok: true });
    expect(store.getState().project.placements).toHaveLength(0);

    expect(store.getState().dispatch({
      type: "PRODUCT_PLACED",
      payload: { productId: "product_groundwork_exercise_mat", position: { xCm: 100, zCm: 70 }, rotation: 0 },
    })).toMatchObject({ ok: true });
    expect(store.getState().project.projectItems).toHaveLength(2);
    expect(store.getState().project.placements).toHaveLength(1);
    expect(store.getState().validation.issues).toContainEqual(expect.objectContaining({
      details: { budget: 53, totalPrice: 54, excess: 1 },
    }));
    expect(store.getState().undo()).toBe(true);
    expect(store.getState().project.projectItems).toHaveLength(1);
    expect(store.getState().project.placements).toHaveLength(0);
    expect(store.getState().redo()).toBe(true);
    expect(store.getState().project.placements).toHaveLength(1);
  });
});
