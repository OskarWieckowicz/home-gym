import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { getProductImage } from "@/features/catalog/product-assets";
import { findProductById, getEffectiveMounting, searchProducts } from "@/features/catalog/queries/catalog";
import { getVisualAsset } from "@/features/creator/scene/visual-assets";
import { createProjectStore } from "@/features/creator/store/project-store";
import { createEquipmentFootprints } from "@/features/geometry/equipment-footprints";
import { createDefaultProject } from "@/features/project/defaults";

const productId = "product_freestanding_dip_bars";
const product = findProductById(productId)!;

describe("Freestanding Dip Bars integration", () => {
  it("provides the approved adjustable photo and one model for the entire pair", () => {
    const visual = getVisualAsset(productId)!;
    const image = getProductImage(productId);
    expect(image).toBe("/assets/freestanding-dip-bars-catalog-concept-v2.png");
    expect(visual).toEqual({
      productId,
      src: "/assets/freestanding-dip-bars.glb",
      topViewSrc: "/assets/freestanding-dip-bars-top.svg",
      envelopeCm: product.dimensions,
      forward: "negative-z",
      floorPivot: "origin",
      scale: [1, 1, 1],
    });
    expect(product.dimensions).toEqual({ widthCm: 120, depthCm: 80, heightCm: 110 });
    for (const path of [image!, visual.src, visual.topViewSrc!]) {
      expect(existsSync(join(process.cwd(), "public", path)), path).toBe(true);
    }
  });

  it("is searchable as independent floor equipment with no rack or wall requirement", () => {
    expect(searchProducts({ query: "freestanding dip", exercise: "dip", anchoring: "none", maxPrice: 499 }))
      .toEqual([product]);
    expect(searchProducts({ query: "freestanding dip", maxPrice: 498 })).toEqual([]);
    expect(getEffectiveMounting(product)).toEqual({ kind: "floor" });
    expect(product).toMatchObject({ placementMode: "floor", price: 499 });
    expect(product.requirements).toEqual({
      minimumCeilingHeightCm: 210,
      flooring: "level-hard-surface",
      assembly: "one-person",
    });
    expect(product.weightKg).toBeUndefined();
    expect(product.maximumLoadKg).toBeUndefined();
  });

  it("places and prices the pair once through shared commands and undo/redo", () => {
    const store = createProjectStore({ ...createDefaultProject(), budget: 498 });
    expect(store.getState().dispatch({
      type: "PRODUCT_PLACED",
      payload: { productId, position: { xCm: 120, zCm: 120 }, rotation: 0 },
    })).toMatchObject({ ok: true, changed: true });
    const placed = store.getState().project;
    expect(placed.projectItems).toEqual([expect.objectContaining({ productId })]);
    expect(placed.placements).toHaveLength(1);
    expect(placed.placements[0].projectItemId).toBe(placed.projectItems[0].id);
    expect(store.getState().validation.issues).toEqual([
      expect.objectContaining({ code: "ACCESS_NOT_EVALUATED", details: { reason: "no-door" } }),
      expect.objectContaining({ code: "BUDGET_EXCEEDED", details: { budget: 498, totalPrice: 499, excess: 1 } }),
    ]);
    expect(store.getState().undo()).toBe(true);
    expect(store.getState().project.projectItems).toHaveLength(0);
    expect(store.getState().project.placements).toHaveLength(0);
    expect(store.getState().redo()).toBe(true);
    expect(store.getState().project).toEqual(placed);
  });

  it.each([
    { rotation: 0, widthCm: 120, depthCm: 80, useWidth: 200, useDepth: 240 },
    { rotation: 90, widthCm: 80, depthCm: 120, useWidth: 240, useDepth: 200 },
    { rotation: 180, widthCm: 120, depthCm: 80, useWidth: 200, useDepth: 240 },
    { rotation: 270, widthCm: 80, depthCm: 120, useWidth: 240, useDepth: 200 },
  ] as const)("reserves both bars, their gap and use margins at $rotation°", ({ rotation, widthCm, depthCm, useWidth, useDepth }) => {
    const footprints = createEquipmentFootprints({ position: { xCm: 120, zCm: 120 }, rotation }, product);
    expect(footprints.physical).toEqual({ minX: 120, minZ: 120, maxX: 120 + widthCm, maxZ: 120 + depthCm, widthCm, depthCm });
    expect(footprints.useZone).toMatchObject({ widthCm: useWidth, depthCm: useDepth });
  });
});
