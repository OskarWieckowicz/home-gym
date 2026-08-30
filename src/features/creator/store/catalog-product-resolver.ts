import { catalogProducts } from "@/data/products";
import { retiredProducts, isRetiredProductId } from "@/data/products/retired-products";
import type { GymProject } from "@/features/project/schemas/project";
import { productIdForPlacement } from "@/features/project/project-lookups";
import type { ProductResolver } from "@/features/project/validation/product-validation";

const CATALOG_PRODUCTS_BY_ID = new Map(
  [...catalogProducts, ...retiredProducts].map((product) => [product.id, product] as const),
);

export const catalogProductResolver: ProductResolver = (productId) => {
  const product = CATALOG_PRODUCTS_BY_ID.get(productId);
  if (!product) return undefined;
  return {
    id: product.id,
    price: product.price,
    dimensions: product.dimensions,
    useZone: product.useZone,
    minimumCeilingHeightCm: product.requirements.minimumCeilingHeightCm,
    mounting: product.mounting,
    placementMode: product.placementMode,
    trainingGoals: product.trainingGoals,
    ...(isRetiredProductId(product.id) ? { retired: true } : {}),
  };
};

export function projectUsesKnownProducts(
  project: GymProject,
  resolveProduct: ProductResolver,
): boolean {
  if (!project.projectItems.every((item) => resolveProduct(item.productId))) {
    return false;
  }

  return project.placements.every((placement) => {
    const productId = productIdForPlacement(project, placement);
    if (!productId) return false;
    const product = resolveProduct(productId);
    return product !== undefined && product.placementMode !== "selection-only";
  });
}
