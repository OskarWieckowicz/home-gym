import type { GymProject } from "@/features/project/schemas/project";
import type { ProductResolver } from "@/features/project/validation/product-validation";

export const SIGNAL_BANDS_RECONCILIATION_NOTICE =
  "Signal Resistance Bands were kept on the shopping list and removed from the room.";

// Catalog compatibility only: preserve each purchased item while removing its
// obsolete room placement. Other invalid references must still be rejected.
export function reconcileCatalogProject(
  project: GymProject,
  resolveProduct: ProductResolver,
): GymProject {
  const productId = "product_signal_resistance_bands";
  if (resolveProduct(productId)?.placementMode !== "selection-only") return project;

  const itemIds = new Set(project.projectItems
    .filter((item) => item.productId === productId)
    .map((item) => item.id));
  const placements = project.placements.filter((placement) => !itemIds.has(placement.projectItemId));
  return placements.length === project.placements.length ? project : { ...project, placements };
}
