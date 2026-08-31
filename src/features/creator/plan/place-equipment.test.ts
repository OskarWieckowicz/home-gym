import { describe, expect, it } from "vitest";

import { catalogProducts } from "@/data/products";
import { retiredProducts } from "@/data/products/retired-products";
import { snapWallMountedPlacement } from "@/features/geometry/wall-mounting";
import { createDefaultProject } from "@/features/project/defaults";
import type { GymProject } from "@/features/project/schemas/project";

import { createProjectStore } from "../store/project-store";
import { createPlaceProductCommand, createPlaceProjectItemCommand } from "./place-equipment";

const productId = "product_northstar_half_rack";
const target = { kind: "floor", position: { xCm: 200, zCm: 160 } } as const;
const items = ["first", "second"].map((suffix) => ({ id: `project-item_${suffix}`, productId }));
const project: GymProject = { ...createDefaultProject(), projectItems: items };

describe("catalog placement commands", () => {
  it("reuses list order, then creates new purchases, with one undo step per placement", () => {
    const store = createProjectStore(project);
    for (const item of items) {
      const result = createPlaceProductCommand(productId, target, store.getState().project);
      expect(result).toMatchObject({ ok: true, command: { type: "PROJECT_ITEM_PLACED", payload: { projectItemId: item.id } } });
      if (!result.ok) throw new Error(result.error);
      expect(store.getState().dispatch(result.command).ok).toBe(true);
      expect(store.getState().project.projectItems).toEqual(items);
    }
    const result = createPlaceProductCommand(productId, target, store.getState().project);
    expect(result).toMatchObject({ ok: true, command: { type: "PRODUCT_PLACED" } });
    if (!result.ok) throw new Error(result.error);
    store.getState().dispatch(result.command);
    expect(store.getState().project.projectItems).toHaveLength(3);
    expect(store.getState().revision).toBe(3);
    store.getState().undo();
    expect(store.getState().project.projectItems).toEqual(items);
    expect(store.getState().project.placements).toHaveLength(2);
    store.getState().undo();
    store.getState().undo();
    expect(store.getState().project).toEqual(project);
    expect(store.getState().canUndo).toBe(false);
  });

  it("reuses a purchase after removing its placement without adding a duplicate", () => {
    const store = createProjectStore(project);
    const result = createPlaceProductCommand(productId, target, project);
    if (!result.ok) throw new Error(result.error);
    store.getState().dispatch(result.command);
    store.getState().dispatch({ type: "PLACEMENT_REMOVED", payload: { placementId: store.getState().project.placements[0].id } });
    const reused = createPlaceProductCommand(productId, target, store.getState().project);
    expect(reused).toMatchObject({ ok: true, command: { type: "PROJECT_ITEM_PLACED", payload: { projectItemId: items[0].id } } });
    if (!reused.ok) throw new Error(reused.error);
    store.getState().dispatch(reused.command);
    expect(store.getState().project.projectItems).toEqual(items);
  });

  it("snaps a reused wall-mounted product using the same geometry as a new purchase", () => {
    const product = catalogProducts.find((candidate) => candidate.id === "product_anchor_pullup_bar")!;
    const existing = { id: "project-item_bar", productId: product.id };
    const result = createPlaceProductCommand(product.id, target, { ...project, projectItems: [existing] });
    expect(result).toEqual({ ok: true, command: { type: "PROJECT_ITEM_PLACED", payload: {
      projectItemId: existing.id, ...snapWallMountedPlacement(target.position, product.dimensions, project.room),
    } } });
  });

  it("rejects missing, selection-only and retired catalog choices even if already on the list", () => {
    const selectionOnly = catalogProducts.find((product) => product.placementMode === "selection-only")!;
    for (const id of ["product_missing", selectionOnly.id, retiredProducts[0].id]) {
      const result = createPlaceProductCommand(id, target, {
        ...project, projectItems: [{ id: "project-item_existing", productId: id }],
      });
      expect(result.ok).toBe(false);
    }
  });

  it("continues allowing explicit placement of a retired item already owned by a project", () => {
    const retired = retiredProducts.find((product) => product.placementMode !== "selection-only")!;
    const existing = { id: "project-item_retired", productId: retired.id };
    const result = createPlaceProjectItemCommand(existing.id, retired.id, target, {
      ...project, projectItems: [existing], room: { widthCm: 1500, depthCm: 1200, heightCm: 400 },
    });
    expect(result).toMatchObject({ ok: true, command: { type: "PROJECT_ITEM_PLACED" } });
  });

  it("rejects stale explicit item identities without falling back to another item or purchase", () => {
    expect(createPlaceProjectItemCommand("project-item_removed", productId, target, project))
      .toEqual({ ok: false, error: "This project item is unavailable." });
    expect(createPlaceProjectItemCommand(items[0].id, "product_anchor_pullup_bar", target, project))
      .toEqual({ ok: false, error: "This project item is unavailable." });
    const placed: GymProject = { ...project, placements: [{ locked: false,
      id: "placement_existing", projectItemId: items[0].id, position: { xCm: 0, zCm: 0 }, rotation: 0,
    }] };
    expect(createPlaceProjectItemCommand(items[0].id, productId, target, placed))
      .toEqual({ ok: false, error: "This project item is already placed." });
  });
});
