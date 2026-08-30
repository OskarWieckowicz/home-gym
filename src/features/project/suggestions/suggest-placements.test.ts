import { describe, expect, it, vi } from "vitest";

import { applyProjectCommand } from "../commands/apply-project-command";
import { analyzeProject } from "../validation/analyze-project";
import { createProjectAnalysis } from "../validation/project-analysis";
import { suggestPlacements } from "./suggest-placements";
import { suggestionDependencies, suggestionProduct, suggestionProject } from "./test-fixtures";

describe("suggestPlacements", () => {
  it("is byte-identical on repeat calls and never mutates the project or consumes random IDs", () => {
    const project = suggestionProject();
    const original = structuredClone(project);
    const randomIds = vi.fn(() => { throw new Error("Must not generate IDs"); });
    const dependencies = { ...suggestionDependencies, generateProjectItemId: randomIds, generatePlacementId: randomIds };
    const request = { productId: "product_test", rotations: [0 as const] };
    const first = suggestPlacements(project, request, dependencies);
    expect(first.candidates).toHaveLength(3);
    expect(JSON.stringify(suggestPlacements(project, request, dependencies))).toBe(JSON.stringify(first));
    expect(JSON.stringify(suggestPlacements(structuredClone(project), request, dependencies))).toBe(JSON.stringify(first));
    expect(project).toEqual(original);
    expect(randomIds).not.toHaveBeenCalled();
    expect(first.generatedCount).toBe(49);
    expect(first.rejectedCount).toBeGreaterThan(0);
    expect(first.candidates.map(({ candidateIndex }) => candidateIndex)).toEqual([0, 1, 2]);
    expect(suggestPlacements(project, { ...request, limit: 10 }, dependencies).candidates).toHaveLength(10);
  });

  it("returns exact applicable commands and reuses the baseline analysis", () => {
    const project = suggestionProject();
    const analyzer = vi.fn((value) => analyzeProject(value, suggestionDependencies));
    const suggestions = suggestPlacements(project, { productId: "product_test", rotations: [0], limit: 1 }, {
      ...suggestionDependencies, analyzeProject: analyzer,
    });
    expect(analyzer.mock.calls.filter(([value]) => value === project)).toHaveLength(1);
    const execution = applyProjectCommand(project, suggestions.candidates[0].command, suggestionDependencies);
    expect(execution.result.ok).toBe(true);
    expect(execution.project.placements[0].position).toEqual(suggestions.candidates[0].position);
  });

  it("returns an explained empty result when a product cannot fit", () => {
    const result = suggestPlacements(suggestionProject(), { productId: "product_test" }, {
      ...suggestionDependencies,
      resolveProduct: () => ({ ...suggestionProduct, dimensions: { widthCm: 200, depthCm: 200, heightCm: 50 } }),
    });
    expect(result.candidates).toEqual([]);
    expect(result.rejectedCount).toBe(result.generatedCount);
    expect(result.rejectionReasons.OUTSIDE_ROOM).toBe(result.generatedCount);
  });

  it("can retain an already optimal pose or propose a move without duplicating the existing item", () => {
    const project = suggestionProject();
    project.projectItems.push({ id: "project-item_existing", productId: "product_test" });
    project.placements.push({ id: "placement_existing", projectItemId: "project-item_existing",
      position: { xCm: 0, zCm: 0 }, rotation: 0 });
    const request = { projectItemId: "project-item_existing", rotations: [0 as const], limit: 1 };
    const current = suggestPlacements(project, request, suggestionDependencies).candidates[0];
    expect(applyProjectCommand(project, current.command, suggestionDependencies).result)
      .toMatchObject({ ok: true, changed: false });
    const moved = suggestPlacements(project, { ...request,
      region: { minXCm: 30, maxXCm: 30, minZCm: 0, maxZCm: 0 },
    }, suggestionDependencies).candidates[0];
    const execution = applyProjectCommand(project, moved.command, suggestionDependencies);
    expect(execution.result).toMatchObject({ ok: true, changed: true });
    expect(execution.project.projectItems).toHaveLength(1);
    expect(execution.project.placements).toHaveLength(1);
    expect(execution.project.placements[0]).toMatchObject({ id: "placement_existing", position: { xCm: 30, zCm: 0 } });
  });

  it("ranks a warning overlap below a clean candidate, breaking ties by scan order", () => {
    const result = suggestPlacements(suggestionProject(), {
      productId: "product_test", rotations: [0], limit: 3,
      region: { minXCm: 0, maxXCm: 20, minZCm: 0, maxZCm: 0 },
    }, {
      ...suggestionDependencies,
      analyzeProject: (project) => createProjectAnalysis(project.placements[0]?.position.xCm === 0 ? [{
        code: "USE_ZONE_OVERLAP", severity: "warning", entityIds: ["placement_a", "placement_b"],
        details: { overlap: { minX: 0, minZ: 0, maxX: 10, maxZ: 10 }, useZonePlacementId: "placement_a", blockingEntityId: "placement_b" },
      }] : []),
    });
    expect(result.candidates.map(({ position }) => position.xCm)).toEqual([10, 20, 0]);
    expect(result.candidates[2].warnings[0].code).toBe("USE_ZONE_OVERLAP");
    expect(result.rejectedCount).toBe(0);
  });

  it("never returns candidates that block a real door or strand an entity", () => {
    const project = suggestionProject();
    project.room = { widthCm: 200, depthCm: 200, heightCm: 240 };
    project.wallElements.push({ id: "wall-element_door", kind: "door", name: "Door", wall: "top", offsetCm: 0, widthCm: 80 });
    const dependencies = {
      ...suggestionDependencies,
      resolveProduct: () => ({ ...suggestionProduct, dimensions: { widthCm: 80, depthCm: 80, heightCm: 100 } }),
    };
    const result = suggestPlacements(project, {
      productId: "product_test", rotations: [0], limit: 10,
      region: { minXCm: 0, maxXCm: 120, minZCm: 0, maxZCm: 0 },
    }, dependencies);
    expect(result.rejectionReasons.DOOR_BLOCKED).toBeGreaterThan(0);
    expect(result.candidates.length).toBeGreaterThan(0);
    for (const candidate of result.candidates) {
      const next = applyProjectCommand(project, candidate.command, dependencies);
      const analysis = analyzeProject(next.project, dependencies);
      expect(analysis.errorCount).toBe(0);
      expect(analysis.access.facts.some(({ state }) => state === "unreachable")).toBe(false);
    }
  });

  it("keeps a real use-zone overlap available below clean placements", () => {
    const project = suggestionProject();
    project.room.widthCm = 100;
    project.projectItems.push({ id: "project-item_existing", productId: "product_test" });
    project.placements.push({ id: "placement_existing", projectItemId: "project-item_existing", position: { xCm: 0, zCm: 0 }, rotation: 0 });
    const result = suggestPlacements(project, {
      productId: "product_test", rotations: [0], limit: 10,
      region: { minXCm: 20, maxXCm: 80, minZCm: 0, maxZCm: 0 },
    }, {
      ...suggestionDependencies,
      resolveProduct: () => ({ ...suggestionProduct, useZone: { ...suggestionProduct.useZone, rightCm: 20 } }),
    });
    expect(result.candidates[0].position.xCm).toBe(40);
    expect(result.candidates.at(-1)?.position.xCm).toBe(30);
    expect(result.candidates.at(-1)?.warningCounts.USE_ZONE_OVERLAP).toBe(1);
    expect(result.rejectionReasons.USE_ZONE_OUTSIDE_ROOM).toBe(2);
  });
});
