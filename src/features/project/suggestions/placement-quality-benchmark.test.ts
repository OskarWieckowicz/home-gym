import { describe, expect, it } from "vitest";

import { catalogProductResolver } from "@/features/creator/store/catalog-product-resolver";

import { applyProjectCommand } from "../commands/apply-project-command";
import { REPORTED_ROOM_FUNCTIONAL_CLEARANCE } from "../fixtures/reported-room-functional-clearance";
import { analyzeProject } from "../validation/analyze-project";
import { suggestPlacements } from "./suggest-placements";

const dependencies = {
  candidateIdPrefix: "quality-benchmark",
  resolveProduct: catalogProductResolver,
};

function cleanReportedRoom() {
  const project = structuredClone(REPORTED_ROOM_FUNCTIONAL_CLEARANCE);
  // The source fixture intentionally demonstrates a functional-zone violation.
  // Ranking starts from the same measured furniture without that test kettlebell.
  project.projectItems = [];
  project.placements = [];
  return project;
}

describe("placement quality benchmark", () => {
  it("places stands on the available perimeter, then leaves an accessible bench and open area", () => {
    let project = cleanReportedRoom();
    const stands = suggestPlacements(project, {
      productId: "product_harbor_squat_stands",
      rotations: [180],
      region: { minXCm: 0, maxXCm: 500, minZCm: 200, maxZCm: 400 },
      limit: 1,
    }, dependencies).candidates[0];

    expect(stands.candidateIndex).toBeGreaterThan(0);
    expect(stands.warningCounts).toEqual({});
    expect(stands.scoreBreakdown).toMatchObject({
      warningPenalty: 0,
      perimeterDistanceCm: 0,
      furnitureClearanceDistanceCm: expect.any(Number),
    });
    expect(stands.scoreBreakdown.furnitureClearanceDistanceCm).toBeGreaterThanOrEqual(100);

    const standsExecution = applyProjectCommand(project, stands.command, dependencies);
    expect(standsExecution.result).toMatchObject({ ok: true, changed: true });
    project = standsExecution.project;

    const bench = suggestPlacements(project, {
      productId: "product_arc_adjustable_bench",
      rotations: [90, 270],
      region: { minXCm: 0, maxXCm: 500, minZCm: 200, maxZCm: 400 },
      limit: 1,
    }, dependencies).candidates[0];
    expect(bench.warningCounts).toEqual({});
    expect(bench.scoreBreakdown.warningPenalty).toBe(0);
    expect(bench.scoreBreakdown.furnitureClearanceDistanceCm).toBeGreaterThanOrEqual(90);
    expect(bench.scoreBreakdown.contiguousFreeAreaCells).toBeGreaterThan(0);

    const benchExecution = applyProjectCommand(project, bench.command, dependencies);
    expect(benchExecution.result).toMatchObject({ ok: true, changed: true });
    const finalAnalysis = analyzeProject(benchExecution.project, dependencies);
    expect(finalAnalysis.errorCount).toBe(0);
    expect(finalAnalysis.access.facts.some(({ state }) => state === "unreachable")).toBe(false);
  }, 15_000);

  it.each([
    ["compact plate storage", "product_cairn_iron_plates", [180] as const],
    ["wall-mounted pull-up bar", "product_anchor_pullup_bar", [180] as const],
  ])("keeps the %s clean and away from declared furniture zones", (_label, productId, rotations) => {
    const candidate = suggestPlacements(cleanReportedRoom(), {
      productId,
      rotations: [...rotations],
      limit: 1,
    }, dependencies).candidates[0];

    expect(candidate.warningCounts).toEqual({});
    expect(candidate.scoreBreakdown.warningPenalty).toBe(0);
    expect(candidate.scoreBreakdown.furnitureClearanceDistanceCm).toBeGreaterThan(0);
    expect(candidate.scoreBreakdown.contiguousFreeAreaCells).toBeGreaterThan(0);
  });
});
