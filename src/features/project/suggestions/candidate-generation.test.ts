import { describe, expect, it } from "vitest";
import { z } from "zod";

import { generatePlacementCandidates, PlacementSuggestionError } from "./candidate-generation";
import { placementSuggestionRequestSchema } from "./request-schema";
import { suggestionDependencies, suggestionProject } from "./test-fixtures";

describe("placement candidate generation", () => {
  it("scans z, x, cardinal rotation on an origin-aligned 10cm grid", () => {
    const candidates = generatePlacementCandidates(suggestionProject(), {
      productId: "product_test", rotations: [270, 90, 90],
      region: { minXCm: 3, minZCm: 7, maxXCm: 20, maxZCm: 20 },
    }, suggestionDependencies);
    expect(candidates.map(({ position, rotation }) => [position.zCm, position.xCm, rotation])).toEqual([
      [10, 10, 90], [10, 10, 270], [10, 20, 90], [10, 20, 270],
      [20, 10, 90], [20, 10, 270], [20, 20, 90], [20, 20, 270],
    ]);
    expect(candidates[0].placementId).toBe("placement_candidate_1");
  });

  it("chooses shared commands for selected and already placed items", () => {
    const project = suggestionProject();
    project.projectItems.push({ id: "project-item_test", productId: "product_test" });
    const request = { projectItemId: "project-item_test", rotations: [0 as const] };
    expect(generatePlacementCandidates(project, request, suggestionDependencies)[0].command.type).toBe("PROJECT_ITEM_PLACED");
    project.placements.push({ id: "placement_test", projectItemId: "project-item_test", position: { xCm: 20, zCm: 20 }, rotation: 0 });
    expect(generatePlacementCandidates(project, request, suggestionDependencies)[0].command).toEqual({
      type: "PLACEMENT_UPDATED", payload: { placementId: "placement_test", patch: { position: { xCm: 0, zCm: 0 }, rotation: 0 } },
    });
  });

  it("avoids injected IDs already present in a project deterministically", () => {
    const project = suggestionProject();
    project.projectItems.push({ id: "project-item_candidate_1", productId: "product_test" });
    expect(generatePlacementCandidates(project, { productId: "product_test" }, suggestionDependencies)[0].projectItemId).toBe("project-item_candidate_1_1");
  });

  it("rejects ambiguous requests and exposes an equivalent JSON schema", () => {
    expect(placementSuggestionRequestSchema.safeParse({ productId: "product_test", projectItemId: "project-item_test" }).success).toBe(false);
    expect(placementSuggestionRequestSchema.safeParse({ productId: "product_test", limit: 11 }).success).toBe(false);
    expect(placementSuggestionRequestSchema.safeParse({ productId: "product_test", rotations: [] }).success).toBe(false);
    expect(z.toJSONSchema(placementSuggestionRequestSchema)).toHaveProperty("anyOf");
  });

  it("rejects reversed regions and oversized searches before allocation", () => {
    const project = suggestionProject();
    expect(() => generatePlacementCandidates(project, {
      productId: "product_test", region: { minXCm: 20, maxXCm: 10, minZCm: 0, maxZCm: 10 },
    }, suggestionDependencies)).toThrow(PlacementSuggestionError);
    project.room.widthCm = 1_000_000_000;
    expect(() => generatePlacementCandidates(project, { productId: "product_test" }, suggestionDependencies)).toThrow(/search is too large/);
    expect(generatePlacementCandidates(project, {
      productId: "product_test", region: { minXCm: 0, maxXCm: 1_000_000_000, minZCm: 100, maxZCm: 200 },
    }, suggestionDependencies)).toEqual([]);
  });

  it("rejects unknown references and non-placeable products", () => {
    expect(() => generatePlacementCandidates(suggestionProject(), { productId: "product_missing" }, suggestionDependencies)).toThrow(/does not exist/);
    expect(() => generatePlacementCandidates(suggestionProject(), { projectItemId: "project-item_missing" }, suggestionDependencies)).toThrow(/does not exist/);
    expect(() => generatePlacementCandidates(suggestionProject(), { productId: "product_test" }, {
      ...suggestionDependencies,
      resolveProduct: (id) => ({ ...suggestionDependencies.resolveProduct(id)!, placementMode: "selection-only" }),
    })).toThrow(/cannot be placed/);
  });

  it("bounds access allocation even when the requested region has just one point", () => {
    const project = suggestionProject();
    project.room = { widthCm: 100_000, depthCm: 100_000, heightCm: 240 };
    project.wallElements.push({ id: "wall-element_door", kind: "door", name: "Door", wall: "top", offsetCm: 0, widthCm: 80 });
    expect(() => generatePlacementCandidates(project, {
      productId: "product_test", rotations: [0], region: { minXCm: 0, maxXCm: 0, minZCm: 0, maxZCm: 0 },
    }, suggestionDependencies)).toThrow(/access cells/);
  });
});
