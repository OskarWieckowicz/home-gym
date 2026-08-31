import { describe, expect, it } from "vitest";
import { findProjectProductById } from "@/features/catalog/queries/project-products";
import { catalogProductResolver } from "@/features/creator/store/catalog-product-resolver";
import { formatPricePln } from "@/shared/formatters/catalog-formatters";
import { createDemoProject } from "../demo-project";
import { createDefaultProject } from "../defaults";
import type { GymProject } from "../schemas/project";
import { analyzeProject, createProjectAnalysis } from "../validation/analyze-project";
import type { ValidationIssue } from "../validation/validation-issues";
import { buildProjectSummary } from "./project-summary";
import { buildSummaryChecks } from "./project-summary-checks";
import type { SummaryProductResolver } from "./project-summary-types";

function summary(project: GymProject = createDemoProject()) {
  return buildProjectSummary(project, analyzeProject(project, { resolveProduct: catalogProductResolver }), findProjectProductById);
}

describe("buildProjectSummary", () => {
  it("reports all demo items, dimensions, exact analysis prices and coverage", () => {
    const project = createDemoProject();
    const analysis = analyzeProject(project, { resolveProduct: catalogProductResolver });
    const result = summary(project);
    const total = analysis.items.reduce((sum, item) => sum + item.price, 0);
    expect(result.empty).toBe(false);
    expect(result.room).toMatchObject({ areaCm2: 240_000, areaM2: 24, dimensionsLabel: "600 × 400 × 240 cm", areaLabel: "24 m²" });
    expect(result.items).toHaveLength(5);
    expect(result.items.every((item) => item.placed && item.price !== null && item.name !== "Unavailable product")).toBe(true);
    expect(result.totals).toMatchObject({ itemCount: 5, placedCount: 5, totalPrice: total, budget: 10_000, remainingBudget: 10_000 - total, excessBudget: 0, overBudget: false, complete: true });
    expect(result.totals.totalPriceLabel).toBe(formatPricePln(total));
    expect(result.coverage).toMatchObject({ ...analysis.coverage, requestedCount: 1, coveredCount: 1, uncoveredCount: 0, ratio: 1, label: "1 of 1 goals covered" });
    expect(result.valid).toBe(analysis.valid);
    expect(result.coverage.countLabel).toBe("1/1");
    expect(result.errorCount).toBe(analysis.errorCount);
    expect(result.warningCount).toBe(analysis.warningCount);
    expect(result.recommendations).toHaveLength(analysis.warningCount);
    expect(result.recommendations.some(({ message }) => message.includes("share a use zone"))).toBe(true);
  });

  it("reports remaining vs excess budget and caps the visual budget bar", () => {
    const project = createDemoProject();
    project.budget = 1;
    const result = summary(project);
    expect(result.totals.remainingBudget).toBe(0);
    expect(result.totals.excessBudget).toBe(result.totals.totalPrice - 1);
    expect(result.totals.overBudget).toBe(true);
    expect(result.totals.budgetUsedRatio).toBeGreaterThan(1);
    expect(result.totals.budgetUsedPercent).toBe(100);
    expect(result.totals.balanceLabel).toContain("over budget");
    expect(result.checks.find(({ id }) => id === "budget")?.passed).toBe(false);
    expect(result.blockingIssues.some(({ code }) => code === "BUDGET_EXCEEDED")).toBe(true);
  });

  it("handles a zero budget without serializing Infinity or NaN", () => {
    const project = createDemoProject();
    project.budget = 0;
    const result = summary(project);
    expect(result.totals.overBudget).toBe(true);
    expect(result.totals.budgetUsedPercent).toBe(100);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
    const empty = createDefaultProject();
    empty.budget = 0;
    expect(summary(empty).totals).toMatchObject({ overBudget: false, budgetUsedRatio: 0, budgetUsedPercent: 0 });
  });

  it("keeps unplaced purchased equipment in the cost and goal totals", () => {
    const project = createDemoProject();
    const original = summary(project);
    project.placements = project.placements.slice(1);
    project.trainingGoals.push("muscle-gain");
    const result = summary(project);
    expect(result.items[0]).toMatchObject({ placed: false, placementLabel: "Not placed" });
    expect(result.totals).toMatchObject({ totalPrice: original.totals.totalPrice, placedCount: 4, unplacedCount: 1 });
    expect(result.coverage).toMatchObject({ requestedCount: 2, coveredCount: 2, uncoveredCount: 0, ratio: 1 });
    expect(result.coverage.goals.at(-1)).toMatchObject({ id: "muscle-gain", covered: true, statusLabel: "Covered" });
  });

  it("uses analysis price rather than a second price calculation from catalog metadata", () => {
    const project = createDemoProject();
    const analysis = analyzeProject(project, { resolveProduct: catalogProductResolver });
    const modified = { ...analysis, items: analysis.items.map((item) => ({ ...item, price: 7 })) };
    const result = buildProjectSummary(project, modified, findProjectProductById);
    expect(result.totals.totalPrice).toBe(35);
    expect(result.items.every(({ price }) => price === 7)).toBe(true);
  });

  it("labels selection-only purchases without suggesting that placement is missing", () => {
    const project = createDefaultProject();
    project.projectItems.push({ id: "project-item_roller", productId: "product_groundwork_foam_roller" });
    project.trainingGoals = ["mobility"];
    const result = summary(project);
    expect(result.items[0]).toMatchObject({ placed: false, placementLabel: "No floor placement needed", price: 89 });
    expect(result.totals.totalPrice).toBe(89);
    expect(result.coverage.countLabel).toBe("1/1");
    expect(result.floor.freeRatio).toBe(1);
    expect(result.empty).toBe(false);
  });

  it("retains unavailable products without claiming their price or floor metric is complete", () => {
    const project = createDemoProject();
    project.projectItems[0].productId = "product_missing";
    const result = summary(project);
    expect(result.items).toHaveLength(5);
    expect(result.items[0]).toMatchObject({ productId: "product_missing", name: "Unavailable product", price: null, priceLabel: "Price unavailable", dimensions: null, placed: true });
    expect(result.totals).toMatchObject({ complete: false, unavailableCount: 1 });
    expect(result.floor).toEqual({
      complete: false, roomAreaCm2: 240_000,
      occupiedAreaCm2: null, freeAreaCm2: null, freeRatio: null, freePercent: null,
      freeAreaLabel: "Unknown", freePercentLabel: "Unknown",
    });
    expect(JSON.parse(JSON.stringify(result)).floor).toEqual(result.floor);
    expect(result.statusLabel).toBe("Product details unavailable");
    expect(result.totals.totalPriceLabel).toContain("known prices only");
  });

  it("uses project content for empty state and does not assert access without a door", () => {
    const result = summary(createDefaultProject());
    expect(result.empty).toBe(true);
    expect(result.coverage.label).toBe("No training goals selected");
    expect(result.coverage.ratio).toBe(0);
    expect(result.coverage.countLabel).toBe("—");
    expect(result.checks.find(({ id }) => id === "access")).toMatchObject({ passed: false, statusLabel: "Not evaluated" });
    expect(result.recommendations[0].message).toBe("Access cannot be evaluated because this room has no door.");
  });

  it("attributes placement-level blocking errors to the corresponding purchased item", () => {
    const project = createDemoProject();
    project.room.heightCm = 100;
    const result = summary(project);
    expect(result.items[0].blockingIssueCodes).toContain("CEILING_TOO_LOW");
    expect(result.blockingIssues.some(({ message }) => message.includes(result.items[0].name) && message.includes("ceiling height"))).toBe(true);
  });

  it("excludes overhead mounts but counts floor-reserving mounts and unavailable zones", () => {
    const project = createDefaultProject();
    project.projectItems = [{ id: "project-item_test", productId: "product_test" }];
    project.placements = [{ locked: false, id: "placement_test", projectItemId: "project-item_test", position: { xCm: 0, zCm: 0 }, rotation: 90 }];
    project.obstacles = [{ id: "obstacle_zone", kind: "unavailable-zone", name: "Reserved", position: { xCm: 300, zCm: 0 }, dimensions: { widthCm: 20, depthCm: 20 }, rotation: 0, locked: false }];
    const resolve: SummaryProductResolver = () => ({ name: "Mounted", dimensions: { widthCm: 100, depthCm: 50, heightCm: 20 }, placementMode: "floor", trainingGoals: ["strength"], exercises: ["Pull-up"], mounting: { kind: "wall", bottomHeightCm: 200 } });
    const analysis = createProjectAnalysis([]);
    expect(buildProjectSummary(project, analysis, resolve).floor.occupiedAreaCm2).toBe(400);
    const floorMount: SummaryProductResolver = (id) => ({ ...resolve(id)!, mounting: { kind: "wall", bottomHeightCm: 200, blocksFloor: true } });
    expect(buildProjectSummary(project, analysis, floorMount).floor.occupiedAreaCm2).toBe(5_400);
  });

  it("is deterministic, JSON-safe and leaves project and analysis unchanged", () => {
    const project = createDemoProject();
    const analysis = analyzeProject(project, { resolveProduct: catalogProductResolver });
    const before = JSON.stringify({ project, analysis });
    const first = buildProjectSummary(project, analysis, findProjectProductById);
    expect(buildProjectSummary(project, analysis, findProjectProductById)).toEqual(first);
    expect(JSON.parse(JSON.stringify(first))).toEqual(first);
    expect(JSON.stringify({ project, analysis })).toBe(before);
  });
});

describe("summary checklist issue-code mapping", () => {
  it.each([
    ["PHYSICAL_COLLISION", "physical-collisions"], ["UNAVAILABLE_ZONE_CONFLICT", "physical-collisions"],
    ["WALL_ELEMENT_OVERLAP", "physical-collisions"], ["WALL_MOUNT_OVERLAPS_OPENING", "physical-collisions"],
    ["USE_ZONE_OVERLAP", "use-zones"], ["USE_ZONE_OUTSIDE_ROOM", "use-zones"],
    ["OUTSIDE_ROOM", "room-bounds"], ["OUTSIDE_WALL", "room-bounds"],
    ["CEILING_TOO_LOW", "room-bounds"], ["WALL_MOUNT_OFF_WALL", "room-bounds"],
    ["BUDGET_EXCEEDED", "budget"], ["DOOR_BLOCKED", "access"], ["DOOR_UNREACHABLE", "access"],
    ["USE_ZONE_UNREACHABLE", "access"], ["OBSTACLE_UNREACHABLE", "access"], ["ACCESS_TIGHT", "access"],
    ["ACCESS_NOT_EVALUATED", "access"],
  ] as const)("maps %s to %s", (code, checkId) => {
    // This unit exercises code classification only, not issue-detail rendering.
    const issue = { code, severity: "warning", entityIds: [], details: {} } as unknown as ValidationIssue;
    const checks = buildSummaryChecks(createProjectAnalysis([issue], { evaluated: true, reason: null, facts: [] }));
    expect(checks.find(({ id }) => id === checkId)).toMatchObject({ passed: false, issueCodes: [code] });
    expect(checks.filter(({ id }) => id !== checkId).every(({ passed }) => passed)).toBe(true);
  });
});
