import { describe, expect, it } from "vitest";
import { findProductById } from "@/features/catalog/queries/catalog";
import { getProductImage } from "@/features/catalog/product-assets";
import { getVisualAsset } from "@/features/creator/scene/visual-assets";
import { createProjectStore } from "@/features/creator/store/project-store";
import { createDefaultProject } from "@/features/project/defaults";
import { createPlaceProductHandler } from "@/features/webmcp/placement-tool-handlers";

const productId = "product_signal_resistance_bands";

describe("Signal bands shopping-list-only catalog behavior", () => {
  it("preserves the photo, identity and price without a model or floor clearances", () => {
    expect(findProductById(productId)).toMatchObject({
      placementMode: "selection-only", price: 249, weightKg: 1.8,
      useZone: { frontCm: 0, backCm: 0, leftCm: 0, rightCm: 0 },
    });
    expect(getProductImage(productId)).toBe("/assets/signal-resistance-bands-catalog.png");
    expect(getVisualAsset(productId)).toBeUndefined();
  });

  it("counts list additions but rejects manual and agent placement without mutation", () => {
    const store = createProjectStore({ ...createDefaultProject(), budget: 248 });
    expect(store.getState().dispatch({ type: "PROJECT_ITEM_ADDED", payload: { productId } })).toMatchObject({ ok: true });
    const selected = store.getState().project;
    expect(selected.projectItems).toHaveLength(1);
    expect(selected.placements).toHaveLength(0);
    expect(store.getState().validation.issues).toContainEqual(expect.objectContaining({ code: "BUDGET_EXCEEDED" }));
    const payload = { productId, position: { xCm: 100, zCm: 100 }, rotation: 0 };
    expect(store.getState().dispatch({ type: "PRODUCT_PLACED", payload })).toMatchObject({ ok: false });
    expect(createPlaceProductHandler(store)(payload)).toMatchObject({ ok: false });
    expect(store.getState().project).toBe(selected);
    expect(store.getState().undo()).toBe(true);
    expect(store.getState().project.projectItems).toHaveLength(0);
    expect(store.getState().redo()).toBe(true);
    expect(store.getState().project).toEqual(selected);
  });
});
