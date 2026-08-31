import { findProjectProductById, type ProjectProduct } from "@/features/catalog/queries/project-products";
import { productIdForPlacement } from "@/features/project/project-lookups";
import type { GymProject, Placement } from "@/features/project/schemas/project";

export function productForPlacement(
  project: Pick<GymProject, "projectItems">,
  placement: Pick<Placement, "projectItemId">,
): ProjectProduct | undefined {
  const productId = productIdForPlacement(project, placement);
  return productId ? findProjectProductById(productId) : undefined;
}
