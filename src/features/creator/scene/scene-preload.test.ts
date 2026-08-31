import { describe, expect, it } from "vitest";
import { createDefaultProject } from "@/features/project/defaults";
import { projectVisualAssetSources } from "./scene-preload";
import { getVisualAsset } from "./visual-assets";

it("does not preload models for an empty room", () => {
  expect(projectVisualAssetSources(createDefaultProject())).toEqual([]);
});

describe("projectVisualAssetSources", () => {
  it("preloads only placed products, deduplicating URLs and skipping fallbacks", () => {
    const project = createDefaultProject();
    project.projectItems = [
      { id: "rack-one", productId: "product_northstar_half_rack" },
      { id: "rack-two", productId: "product_northstar_half_rack" },
      { id: "bench", productId: "product_arc_adjustable_bench" },
      { id: "fallback", productId: "product_foundry_wall_rack" },
      { id: "unplaced", productId: "product_summit_power_cage" },
    ];
    project.placements = ["rack-one", "rack-two", "bench", "fallback"].map((id) => ({ locked: false,
      id: `placement_${id}`, projectItemId: id,
      position: { xCm: 0, zCm: 0 }, rotation: 0,
    }));
    expect(projectVisualAssetSources(project)).toEqual([
      getVisualAsset("product_northstar_half_rack")!.src,
      getVisualAsset("product_arc_adjustable_bench")!.src,
    ]);
    project.placements = [];
    expect(projectVisualAssetSources(project)).toEqual([]);
  });
});
