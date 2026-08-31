import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { getProductImage } from "@/features/catalog/product-assets";
import { findProductById, searchProducts } from "@/features/catalog/queries/catalog";
import { getVisualAsset } from "@/features/creator/scene/visual-assets";
import { createProjectStore } from "@/features/creator/store/project-store";
import { createEquipmentFootprints } from "@/features/geometry/equipment-footprints";
import { createDefaultProject } from "@/features/project/defaults";
import { createSearchProductsHandler } from "@/features/webmcp/catalog-tool-handlers";
import { createPlaceProductHandler, createUpdatePlacementHandler } from "@/features/webmcp/placement-tool-handlers";

const productId = "product_olympic_bench";
const product = findProductById(productId)!;

describe("Olympic Bench Set integration", () => {
  it("maps the accepted image and spatial assets to the complete loaded-bar envelope", () => {
    expect(product).toMatchObject({
      slug: "olympic-bench", category: "benches", placementMode: "floor", price: 3299,
      dimensions: { widthCm: 220, depthCm: 160, heightCm: 140 },
      useZone: { frontCm: 60, backCm: 60, leftCm: 50, rightCm: 50 },
    });
    expect(product.maximumLoadKg).toBeUndefined();
    const image = getProductImage(productId)!;
    const visual = getVisualAsset(productId)!;
    expect(image).toBe("/assets/olympic-bench-catalog-concept-v1.png");
    expect(visual).toMatchObject({
      src: "/assets/olympic-bench.glb", topViewSrc: "/assets/olympic-bench-top.svg",
      envelopeCm: product.dimensions, forward: "negative-z", floorPivot: "origin", scale: [1, 1, 1],
    });
    for (const asset of [image, visual.src, visual.topViewSrc!]) {
      expect(existsSync(join(process.cwd(), "public", asset)), asset).toBe(true);
    }
  });

  it("offers the same bench set through manual and WebMCP catalog filters", () => {
    const filters = { query: "olympic", category: "benches", exercise: "bench press", maxPrice: 3299 };
    expect(searchProducts(filters)).toEqual([product]);
    expect(createSearchProductsHandler()(filters)).toMatchObject({
      ok: true, matchCount: 1, products: [{ productId, dimensions: product.dimensions }],
    });
    expect(searchProducts({ ...filters, maxPrice: 3298 })).toEqual([]);
    expect(searchProducts({ ...filters, maxWidthCm: 219 })).toEqual([]);
  });

  it("keeps manual placement and agent rotation in one budget and undo history", () => {
    const store = createProjectStore({ ...createDefaultProject(), budget: 3298 });
    expect(store.getState().dispatch({
      type: "PRODUCT_PLACED", payload: { productId, position: { xCm: 90, zCm: 80 }, rotation: 0 },
    })).toMatchObject({ ok: true, changed: true });
    const placed = store.getState().project;
    expect(placed.projectItems).toEqual([expect.objectContaining({ productId })]);
    expect(placed.placements).toHaveLength(1);
    expect(store.getState().validation.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "BUDGET_EXCEEDED", details: { budget: 3298, totalPrice: 3299, excess: 1 } }),
    ]));
    expect(createUpdatePlacementHandler(store)({
      placementId: placed.placements[0].id, patch: { rotation: 90, position: { xCm: 100, zCm: 50 } },
    })).toMatchObject({ ok: true, changed: true });
    expect(store.getState().project.projectItems).toEqual(placed.projectItems);
    expect(store.getState().undo()).toBe(true);
    expect(store.getState().project).toEqual(placed);
    expect(store.getState().undo()).toBe(true);
    expect(store.getState().project.projectItems).toEqual([]);
    expect(store.getState().redo()).toBe(true);
    expect(store.getState().project).toEqual(placed);
  });

  it.each([
    { rotation: 0, widthCm: 220, depthCm: 160, axis: "x", position: { xCm: 181, zCm: 60 } },
    { rotation: 90, widthCm: 160, depthCm: 220, axis: "z", position: { xCm: 60, zCm: 101 } },
    { rotation: 180, widthCm: 220, depthCm: 160, axis: "x", position: { xCm: 181, zCm: 60 } },
    { rotation: 270, widthCm: 160, depthCm: 220, axis: "z", position: { xCm: 60, zCm: 101 } },
  ] as const)("includes bar ends and loading access at $rotation degrees", ({ rotation, widthCm, depthCm, axis, position }) => {
    const footprints = createEquipmentFootprints({ position, rotation }, product);
    expect(footprints.physical).toMatchObject({ widthCm, depthCm });
    expect(footprints.useZone).toMatchObject({
      widthCm: widthCm + (rotation % 180 === 0 ? 100 : 120),
      depthCm: depthCm + (rotation % 180 === 0 ? 120 : 100),
    });
    const store = createProjectStore(createDefaultProject());
    const result = createPlaceProductHandler(store)({ productId, position, rotation });
    expect(result).toMatchObject({
      ok: true, changed: true,
      validation: { issues: expect.arrayContaining([
        expect.objectContaining({ code: "OUTSIDE_ROOM", details: expect.objectContaining({ axes: [axis] }) }),
      ]) },
    });
    expect(store.getState().project.placements).toHaveLength(1);
  });
});
