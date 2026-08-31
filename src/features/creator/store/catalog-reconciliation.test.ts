import { describe, expect, it } from "vitest";

import { createDefaultProject } from "@/features/project/defaults";
import type { GymProject } from "@/features/project/schemas/project";
import { catalogProductResolver } from "./catalog-product-resolver";
import { createProjectStore } from "./project-store";
import { reconcileCatalogProject } from "./reconcile-catalog-project";

function legacyProject(): GymProject {
  const productIds = ["product_signal_resistance_bands", "product_signal_resistance_bands", "product_pivot_flat_bench"];
  return {
    ...createDefaultProject(),
    budget: 12_345,
    trainingGoals: ["strength"],
    projectItems: productIds.map((productId, index) => ({ id: `project-item_${index}`, productId })),
    placements: productIds.map((_, index) => ({ locked: false,
      id: `placement_${index}`, projectItemId: `project-item_${index}`,
      position: { xCm: 100 + index * 50, zCm: 140 }, rotation: 0,
    })),
  };
}

describe("Signal bands catalog compatibility", () => {
  it("keeps all items and project data, removes only obsolete placements, and is idempotent", () => {
    const legacy = legacyProject();
    const reconciled = reconcileCatalogProject(legacy, catalogProductResolver);
    expect(reconciled).toEqual({ ...legacy, placements: [legacy.placements[2]] });
    expect(reconciled.projectItems).toBe(legacy.projectItems);
    expect(legacy.placements).toHaveLength(3);
    expect(reconcileCatalogProject(reconciled, catalogProductResolver)).toBe(reconciled);
    const floorResolver: typeof catalogProductResolver = (id) => {
      const product = catalogProductResolver(id);
      return product ? { ...product, placementMode: "floor" } : undefined;
    };
    expect(reconcileCatalogProject(legacy, floorResolver)).toBe(legacy);
    expect(reconcileCatalogProject(legacy, () => undefined)).toBe(legacy);
  });

  it("initializes a reconciled baseline with every purchase counted and no undo history", () => {
    const legacy = legacyProject();
    const state = createProjectStore(legacy).getState();
    expect(state.project).toEqual({ ...legacy, placements: [legacy.placements[2]] });
    expect(state).toMatchObject({ revision: 0, canUndo: false, canRedo: false });
    expect(state.validation.items).toHaveLength(3);
    expect(state.validation.items.reduce((sum, item) => sum + item.price, 0)).toBe(
      legacy.projectItems.reduce((sum, item) => sum + catalogProductResolver(item.productId)!.price, 0),
    );
    expect(state.validation.items.filter((item) => !item.placed)).toHaveLength(2);
  });

  it("imports once with notice and restores only reconciled snapshots through undo/redo", () => {
    const baseline = createDefaultProject();
    const store = createProjectStore(baseline);
    const legacy = legacyProject();
    expect(store.getState().replaceProject(legacy)).toMatchObject({
      ok: true, changed: true, revision: 1, reconciledSignalBands: true,
    });
    const imported = store.getState().project;
    expect(imported.projectItems).toEqual(legacy.projectItems);
    expect(store.getState().replaceProject(legacy)).toMatchObject({
      ok: true, changed: false, revision: 1, reconciledSignalBands: true,
    });
    expect(store.getState().undo()).toBe(true);
    expect(store.getState().project).toEqual(baseline);
    expect(store.getState().redo()).toBe(true);
    expect(store.getState().project).toEqual(imported);
    expect(imported.placements).toEqual([legacy.placements[2]]);
  });

  it.each(["product_missing", "product_cove_wrist_wraps"])("still rejects unrelated invalid %s references", (productId) => {
    const legacy = legacyProject();
    legacy.projectItems[2].productId = productId;
    expect(() => createProjectStore(legacy)).toThrow(/unavailable catalog product/);
    const store = createProjectStore(createDefaultProject());
    expect(store.getState().replaceProject(legacy)).toMatchObject({ ok: false, changed: false, revision: 0 });
    expect(store.getState().project.projectItems).toEqual([]);
  });
});
