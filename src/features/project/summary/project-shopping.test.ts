import { afterEach, describe, expect, it, vi } from "vitest";
import { findProjectProductById } from "@/features/catalog/queries/project-products";
import { catalogProductResolver } from "@/features/creator/store/catalog-product-resolver";
import * as floorArea from "@/features/geometry/floor-area";
import { createDefaultProject } from "../defaults";
import { createDemoProject } from "../demo-project";
import type { GymProject } from "../schemas/project";
import { analyzeProject } from "../validation/analyze-project";
import { buildProjectSummary } from "./project-summary";
import { buildProjectShopping } from "./project-shopping";

function shopping(project: GymProject) {
  return buildProjectShopping(project, analyzeProject(project, { resolveProduct: catalogProductResolver }), findProjectProductById);
}

afterEach(() => vi.restoreAllMocks());

describe("buildProjectShopping", () => {
  it("shares the summary totals without calculating floor area", () => {
    const project = createDemoProject();
    const analysis = analyzeProject(project, { resolveProduct: catalogProductResolver });
    const totals = buildProjectSummary(project, analysis, findProjectProductById).totals;
    const calculate = vi.spyOn(floorArea, "calculateFloorArea");
    const result = buildProjectShopping(project, analysis, findProjectProductById);
    expect(calculate).not.toHaveBeenCalled();
    expect(result.totals).toEqual(totals);
  });

  it("counts pending floor and wall equipment, excluding accessories, while charging every purchase", () => {
    const project = createDefaultProject();
    project.projectItems = [
      { id: "project-item_bag1", productId: "product_wall_mounted_punching_bag" },
      { id: "project-item_bag2", productId: "product_wall_mounted_punching_bag" },
      { id: "project-item_roller", productId: "product_groundwork_foam_roller" },
      { id: "project-item_retired", productId: "product_cove_folding_bench" },
    ];
    project.placements = [{ locked: false, id: "placement_bag1", projectItemId: "project-item_bag1", position: { xCm: 0, zCm: 0 }, rotation: 0 }];
    const result = shopping(project);
    const bagPrice = result.items[0].price!;
    const benchPrice = result.items[3].price!;
    expect(result.pending).toMatchObject({ count: 2, totalPrice: bagPrice + benchPrice, complete: true });
    expect(result.byProduct.get("product_wall_mounted_punching_bag")).toEqual({ itemCount: 2, placedCount: 1, pendingCount: 1 });
    expect(result.byProduct.get("product_groundwork_foam_roller")).toEqual({ itemCount: 1, placedCount: 0, pendingCount: 0 });
    expect(result.items[2]).toMatchObject({ placementRequired: false, placementLabel: "No placement needed" });
    expect(result.items[3]).toMatchObject({ placementRequired: true, placementLabel: "Not placed", detailsAvailable: true });
    expect(result.totals.totalPrice).toBe(bagPrice * 2 + benchPrice + result.items[2].price!);
  });

  it("keeps zero and exceeded budgets finite and exact", () => {
    const project = createDefaultProject();
    project.budget = 0;
    expect(shopping(project).totals).toMatchObject({ totalPrice: 0, budgetUsedRatio: 0, overBudget: false });
    project.projectItems.push({ id: "project-item_roller", productId: "product_groundwork_foam_roller" });
    const result = shopping(project);
    expect(result.totals).toMatchObject({ totalPrice: 22, excessBudget: 22, remainingBudget: 0, budgetUsedRatio: 1, overBudget: true });
    expect(result.totals.balanceLabel).toContain("over budget");
    expect(JSON.parse(JSON.stringify(result.totals))).toEqual(result.totals);
  });

  it("marks missing metadata and missing analyzed prices as incomplete without inventing prices or placement requirements", () => {
    const project = createDefaultProject();
    project.projectItems = [
      { id: "project-item_missing", productId: "product_missing" },
      { id: "project-item_bench", productId: "product_arc_adjustable_bench" },
    ];
    const analysis = analyzeProject(project, { resolveProduct: catalogProductResolver });
    const result = buildProjectShopping(project, { ...analysis, items: [] }, findProjectProductById);
    expect(result.totals).toMatchObject({ totalPrice: 0, unavailableCount: 2, complete: false });
    expect(result.totals.totalPriceLabel).toContain("known prices only");
    expect(result.items[0]).toMatchObject({ price: null, placementRequired: null, detailsAvailable: false });
    expect(result.pending).toMatchObject({ count: 1, totalPrice: 0, complete: false });
    expect(result.pending.totalPriceLabel).toContain("known prices only");
  });

  it("takes analysis prices as authority and leaves source data unchanged", () => {
    const project = createDemoProject();
    const analysis = analyzeProject(project, { resolveProduct: catalogProductResolver });
    const modified = { ...analysis, items: analysis.items.map((item) => ({ ...item, price: 7 })) };
    const before = JSON.stringify({ project, modified });
    const result = buildProjectShopping(project, modified, findProjectProductById);
    expect(result.totals.totalPrice).toBe(35);
    expect(JSON.stringify({ project, modified })).toBe(before);
  });
});
