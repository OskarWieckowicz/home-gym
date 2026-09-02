import { describe, expect, it } from "vitest";

import { catalogProductResolver } from "@/features/creator/store/catalog-product-resolver";
import { findProjectProductById } from "@/features/catalog/queries/project-products";

import { createDemoProject } from "./demo-project";
import { decodeProjectJson, serializeProject } from "./serialization/project-codec";
import { analyzeProject } from "./validation/analyze-project";
import { buildProjectSummary } from "./summary/project-summary";

const DEMO_PRODUCT_IDS = [
  "product_wall_mounted_punching_bag",
  "product_northstar_half_rack",
  "product_arc_adjustable_bench",
  "product_forge_kettlebell_16kg",
  "product_flex_studio_dumbbells",
] as const;

describe("bundled demo project", () => {
  it("provides the current-format strength room with five placed catalog products", () => {
    const project = createDemoProject();
    expect(project.version).toBe(6);
    expect(project.room).toEqual({ widthCm: 600, depthCm: 400, heightCm: 240 });
    expect(project.budget).toBe(2_500);
    expect(project.trainingGoals).toEqual(["strength"]);
    expect(project.obstacles).toEqual([
      expect.objectContaining({
        kind: "obstacle",
        name: "Physical obstacle",
        locked: false,
        dimensions: { widthCm: 100, depthCm: 50, heightCm: 200 },
      }),
      expect.objectContaining({
        kind: "obstacle",
        name: "Physical obstacle",
        locked: false,
        dimensions: { widthCm: 120, depthCm: 200, heightCm: 50 },
      }),
    ]);
    expect(project.wallElements).toEqual([
      expect.objectContaining({ kind: "door", wall: "top", offsetCm: 90, widthCm: 90 }),
      expect.objectContaining({ kind: "window", wall: "right", offsetCm: 80, widthCm: 120 }),
      expect.objectContaining({ kind: "window", wall: "right", offsetCm: 210, widthCm: 120 }),
    ]);
    expect(project.projectItems.map(({ productId }) => productId)).toEqual([...DEMO_PRODUCT_IDS]);
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
    expect(analysis.warningCount).toBe(3);
    expect(analysis.issues).toEqual([
      expect.objectContaining({ code: "USE_ZONE_OVERLAP", severity: "warning" }),
      expect.objectContaining({ code: "USE_ZONE_OVERLAP", severity: "warning" }),
      expect.objectContaining({ code: "USE_ZONE_OVERLAP", severity: "warning" }),
    ]);
    expect(analysis.access.evaluated).toBe(true);
    expect(analysis.access.facts).toHaveLength(8);
    expect(analysis.access.facts.filter(({ state }) => state === "unreachable")).toEqual([]);
    expect(analysis.items).toHaveLength(5);
    expect(analysis.items.every(({ placed }) => placed)).toBe(true);
    const expectedCost = createDemoProject().projectItems.reduce((sum, item) =>
      sum + findProjectProductById(item.productId)!.price, 0);
    expect(analysis.items.reduce((cost, { price }) => cost + price, 0)).toBe(expectedCost);
    expect(expectedCost).toBe(1600);
    expect(expectedCost).toBeLessThanOrEqual(createDemoProject().budget);
    expect(analysis.coverage.uncovered).toEqual([]);
    const summary = buildProjectSummary(createDemoProject(), analysis, findProjectProductById);
    expect(summary.totals.totalPrice).toBe(1600);
    expect(summary.totals.remainingBudget).toBe(900);
    expect(summary.coverage.countLabel).toBe("1/1");
    expect(summary.floor.freePercent).toBe(74);
  });
});
