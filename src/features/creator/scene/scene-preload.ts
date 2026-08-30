import type { GymProject } from "@/features/project/schemas/project";
import { getVisualAsset } from "./visual-assets";

export function projectVisualAssetSources(project: GymProject): string[] {
  const placedItems = new Set(project.placements.map((placement) => placement.projectItemId));
  const sources = new Set<string>();
  for (const item of project.projectItems) {
    if (!placedItems.has(item.id)) continue;
    const asset = getVisualAsset(item.productId);
    if (asset) sources.add(asset.src);
  }
  return [...sources];
}
