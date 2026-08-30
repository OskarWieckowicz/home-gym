import { describe, expect, it } from "vitest";
import { catalogProducts } from "./products";
import { retiredProducts } from "./retired-products";
import { findProductById, findProductBySlug, searchProducts } from "@/features/catalog/queries/catalog";
import { findProjectProductById } from "@/features/catalog/queries/project-products";
import { getProductImage } from "@/features/catalog/product-assets";
import { getVisualAsset } from "@/features/creator/scene/visual-assets";
import { createProjectStore } from "@/features/creator/store/project-store";
import { catalogProductResolver } from "@/features/creator/store/catalog-product-resolver";
import { createDefaultProject } from "@/features/project/defaults";
import { decodeProject, serializeProject } from "@/features/project/serialization/project-codec";
import legacyRoom from "@/features/project/serialization/fixtures/v3-four-product-room.json";
import { createGetProductDetailsHandler } from "@/features/webmcp/catalog-tool-handlers";
import { createPlaceProductHandler } from "@/features/webmcp/placement-tool-handlers";
import { serializeProjectItem } from "@/features/webmcp/room-tool-results";
import { createPlaceProductCommand, createPlaceProjectItemCommand } from "@/features/creator/plan/place-equipment";
import { suggestPlacements } from "@/features/project/suggestions/suggest-placements";

describe("incomplete product retirement", () => {
  it("leaves exactly 21 fully illustrated placeable products and three list-only items", () => {
    expect(catalogProducts).toHaveLength(24);
    expect(retiredProducts).toHaveLength(16);
    expect(new Set([...catalogProducts, ...retiredProducts].map(({ id }) => id)).size).toBe(40);
    const floor = catalogProducts.filter(({ placementMode }) => placementMode === "floor");
    expect(floor).toHaveLength(21);
    for (const product of floor) {
      expect(getProductImage(product.id)).toBeDefined();
      expect(getVisualAsset(product.id)?.topViewSrc).toBeDefined();
    }
  });

  it.each(retiredProducts)("hides $name from active catalog and blocks new additions", (product) => {
    expect(findProductById(product.id)).toBeUndefined();
    expect(findProductBySlug(product.slug)).toBeUndefined();
    expect(searchProducts({ query: product.name })).not.toContainEqual(product);
    expect(createGetProductDetailsHandler()({ productId: product.id })).toMatchObject({ ok: false });
    expect(findProjectProductById(product.id)).toEqual(product);
    expect(catalogProductResolver(product.id)).toMatchObject({ retired: true, price: product.price, dimensions: product.dimensions });
    const store = createProjectStore(createDefaultProject());
    const before = store.getState().project;
    expect(store.getState().dispatch({ type: "PROJECT_ITEM_ADDED", payload: { productId: product.id } })).toMatchObject({ ok: false });
    expect(createPlaceProductHandler(store)({ productId: product.id, position: { xCm: 50, zCm: 50 }, rotation: 0 })).toMatchObject({ ok: false });
    expect(createPlaceProductCommand(product.id, { kind: "floor", position: { xCm: 200, zCm: 200 } }, before)).toMatchObject({ ok: false });
    expect(() => suggestPlacements(before, { productId: product.id }, { resolveProduct: catalogProductResolver, candidateIdPrefix: "retired" })).toThrow(/retired/);
    expect(store.getState().project).toBe(before);
    expect(store.getState().canUndo).toBe(false);
  });

  it("loads the unchanged v3 room including retired Ironvale without losing geometry or cost", () => {
    const decoded = decodeProject(legacyRoom);
    if (!decoded.success) throw new Error(decoded.error.message);
    const state = createProjectStore(decoded.project).getState();
    expect(state.project).toEqual(decoded.project);
    expect(state.project.projectItems).toHaveLength(4);
    expect(state.project.placements).toHaveLength(4);
    expect(state.validation.items.reduce((sum, item) => sum + item.price, 0)).toBe(8596);
    const item = state.project.projectItems.find(({ productId }) => productId === "product_ironvale_barbell_set")!;
    expect(serializeProjectItem(item, state.project)).toMatchObject({ retired: true, name: "Ironvale Barbell Set", placed: true });
    const saved = serializeProject(state.project);
    expect(saved.success).toBe(true);
    if (saved.success) expect(decodeProject(JSON.parse(saved.json))).toEqual(decoded);
  });

  it("keeps legacy purchases editable and supports undoable imports and re-placement", () => {
    const productId = "product_cove_folding_bench";
    const legacy = { ...createDefaultProject(), projectItems: [{ id: "project-item_old", productId }], placements: [] };
    const store = createProjectStore(createDefaultProject());
    expect(store.getState().replaceProject(legacy)).toMatchObject({ ok: true, changed: true });
    expect(store.getState().undo()).toBe(true);
    expect(store.getState().project.projectItems).toHaveLength(0);
    expect(store.getState().redo()).toBe(true);
    const command = createPlaceProjectItemCommand("project-item_old", productId,
      { kind: "floor", position: { xCm: 200, zCm: 160 } }, store.getState().project);
    if (!command.ok) throw new Error(command.error);
    expect(store.getState().dispatch(command.command)).toMatchObject({ ok: true });
    const placementId = store.getState().project.placements[0].id;
    expect(store.getState().dispatch({ type: "PLACEMENT_UPDATED", payload: { placementId, patch: { position: { xCm: 100, zCm: 100 } } } })).toMatchObject({ ok: true });
    expect(store.getState().dispatch({ type: "PLACEMENT_REMOVED", payload: { placementId } })).toMatchObject({ ok: true });
    expect(store.getState().project.projectItems).toEqual(legacy.projectItems);
    expect(() => store.getState().suggestPlacements({ projectItemId: "project-item_old", rotations: [0],
      region: { minXCm: 100, maxXCm: 100, minZCm: 100, maxZCm: 100 } })).not.toThrow();
    expect(store.getState().dispatch(command.command)).toMatchObject({ ok: true });
    expect(store.getState().project.placements).toHaveLength(1);
  });
});
