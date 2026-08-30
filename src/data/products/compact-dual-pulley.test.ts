import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { getProductImage } from "@/features/catalog/product-assets";
import { findProductById, searchProducts } from "@/features/catalog/queries/catalog";
import { getVisualAsset } from "@/features/creator/scene/visual-assets";
import { createProjectStore } from "@/features/creator/store/project-store";
import { createDefaultProject } from "@/features/project/defaults";

const productId = "product_compact_dual_pulley_station";

describe("Compact Dual-Pulley Station integration", () => {
  it("exposes matching photo, model and top view at the authored catalog size", () => {
    const product = findProductById(productId)!;
    const visual = getVisualAsset(productId)!;
    expect(product).toMatchObject({
      slug: "compact-dual-pulley-station",
      placementMode: "floor",
      dimensions: { widthCm: 160, depthCm: 100, heightCm: 220 },
      useZone: { frontCm: 180, backCm: 20, leftCm: 60, rightCm: 60 },
      requirements: { anchoring: "required", minimumCeilingHeightCm: 245 },
    });
    expect(product.mounting).toBeUndefined();
    expect(visual).toEqual({
      productId,
      src: "/assets/compact-dual-pulley-station.glb",
      topViewSrc: "/assets/compact-dual-pulley-station-top.svg",
      envelopeCm: product.dimensions,
      forward: "negative-z",
      floorPivot: "origin",
      scale: [1, 1, 1],
    });
    const image = getProductImage(productId);
    expect(image).toBe("/assets/compact-dual-pulley-station-catalog-concept-v1.png");
    for (const path of [image!, visual.src, visual.topViewSrc!]) {
      expect(existsSync(join(process.cwd(), "public", path)), path).toBe(true);
    }
  });

  it("is searchable without replacing the narrow Loop station", () => {
    expect(searchProducts({ query: "dual-pulley", exercise: "cable row", maxPrice: 6999 }))
      .toEqual([expect.objectContaining({ id: productId })]);
    expect(searchProducts({ query: "dual-pulley", maxPrice: 6998 })).toEqual([]);
    expect(findProductById("product_loop_cable_trainer")).toMatchObject({
      slug: "loop-cable-trainer",
      name: "Loop Wall Cable Trainer",
      price: 2799,
      dimensions: { widthCm: 62, depthCm: 28, heightCm: 205 },
      useZone: { frontCm: 90, backCm: 0, leftCm: 40, rightCm: 40 },
    });
  });

  it("uses shared placement, budget, ceiling validation and undo/redo", () => {
    const store = createProjectStore({ ...createDefaultProject(), budget: 6998 });
    expect(store.getState().dispatch({
      type: "PRODUCT_PLACED",
      payload: { productId, position: { xCm: 200, zCm: 90 }, rotation: 0 },
    })).toMatchObject({ ok: true, changed: true });
    const placed = store.getState().project;
    expect(placed.projectItems).toEqual([expect.objectContaining({ productId })]);
    expect(placed.placements).toHaveLength(1);
    expect(store.getState().validation.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "CEILING_TOO_LOW" }),
      expect.objectContaining({ details: { budget: 6998, totalPrice: 6999, excess: 1 } }),
    ]));
    expect(store.getState().undo()).toBe(true);
    expect(store.getState().project.placements).toHaveLength(0);
    expect(store.getState().redo()).toBe(true);
    expect(store.getState().project).toEqual(placed);
  });
});
