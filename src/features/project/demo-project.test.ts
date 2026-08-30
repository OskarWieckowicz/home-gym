import { describe, expect, it } from "vitest";

import { catalogProductResolver } from "@/features/creator/store/catalog-product-resolver";
import { catalogProducts } from "@/data/products";

import { createDemoProject } from "./demo-project";
import { decodeProjectJson, serializeProject } from "./serialization/project-codec";
import { analyzeProject } from "./validation/analyze-project";

describe("bundled demo project", () => {
  it("provides the v4 strength room with four placed catalog products", () => {
    const project = createDemoProject();
    expect(project.version).toBe(4);
    expect(project.room).toEqual({ widthCm: 400, depthCm: 320, heightCm: 240 });
    expect(project.budget).toBe(10_000);
    expect(project.trainingGoals).toEqual(["strength", "muscle-gain"]);
    expect(project.obstacles).toEqual([expect.objectContaining({ name: "Wardrobe", locked: true })]);
    expect(project.wallElements).toEqual([expect.objectContaining({ kind: "door", wall: "top" })]);
    expect(project.projectItems.map(({ productId }) => productId)).toEqual([
      "product_northstar_half_rack",
      "product_arc_adjustable_bench",
      "product_ironvale_barbell_set",
      "product_foundry_bumper_plates",
    ]);
    expect(project.placements.map(({ projectItemId }) => projectItemId).sort())
      .toEqual(project.projectItems.map(({ id }) => id).sort());
    for (const item of project.projectItems) {
      expect(catalogProductResolver(item.productId)).toBeDefined();
    }
  });

  it("returns independent nested data and survives JSON export/import", () => {
    const baseline = createDemoProject();
    const editable = createDemoProject();
    editable.room.widthCm = 500;
    editable.obstacles[0].position.xCm = 10;
    editable.wallElements[0].offsetCm = 10;
    editable.projectItems[0].productId = "product_other";
    editable.placements[0].position.xCm = 10;
    editable.trainingGoals.pop();
    expect(createDemoProject()).toEqual(baseline);

    const serialized = serializeProject(baseline);
    expect(serialized.success).toBe(true);
    if (!serialized.success) throw new Error(serialized.error.message);
    const decoded = decodeProjectJson(serialized.json);
    expect(decoded).toEqual({ success: true, project: baseline });
    if (!decoded.success) throw new Error(decoded.error.message);
    expect(serializeProject(decoded.project)).toEqual(serialized);
  });

  it("has a valid, reachable layout with meaningful clearance warnings and an accurate budget", () => {
    const analysis = analyzeProject(createDemoProject(), { resolveProduct: catalogProductResolver });
    expect(analysis.errorCount, JSON.stringify(analysis.issues)).toBe(0);
    expect(analysis.valid).toBe(true);
    expect(analysis.warningCount).toBeGreaterThan(0);
    expect(analysis.issues).toContainEqual(expect.objectContaining({
      code: "USE_ZONE_OVERLAP",
      severity: "warning",
    }));
    expect(analysis.access.evaluated).toBe(true);
    expect(analysis.access.facts).toHaveLength(6);
    expect(analysis.access.facts.filter(({ state }) => state === "unreachable")).toEqual([]);
    expect(analysis.items).toHaveLength(4);
    expect(analysis.items.every(({ placed }) => placed)).toBe(true);
    const expectedCost = createDemoProject().projectItems.reduce((sum, item) =>
      sum + catalogProducts.find((product) => product.id === item.productId)!.price, 0);
    expect(analysis.items.reduce((cost, { price }) => cost + price, 0)).toBe(expectedCost);
    expect(expectedCost).toBeLessThanOrEqual(createDemoProject().budget);
    expect(analysis.coverage.uncovered).toEqual([]);
  });
});
