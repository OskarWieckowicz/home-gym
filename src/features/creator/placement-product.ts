import { findProductById } from "@/features/catalog/queries/catalog";
import type { Product } from "@/features/catalog/schemas";
import { productIdForPlacement } from "@/features/project/project-lookups";
import type { GymProject, Placement } from "@/features/project/schemas/project";

export function productForPlacement(
  project: Pick<GymProject, "projectItems">,
  placement: Pick<Placement, "projectItemId">,
): Product | undefined {
  const productId = productIdForPlacement(project, placement);
  return productId ? findProductById(productId) : undefined;
}
