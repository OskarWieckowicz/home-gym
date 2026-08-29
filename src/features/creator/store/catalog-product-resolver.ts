import { catalogProducts } from "@/data/products";
import type { GymProject } from "@/features/project/schemas/project";
import type { ProductResolver } from "@/features/project/validation/product-validation";

const CATALOG_PRODUCTS_BY_ID = new Map(
  catalogProducts.map((product) => [product.id, product] as const),
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
  };
};

export function projectUsesKnownProducts(
  project: GymProject,
  resolveProduct: ProductResolver,
): boolean {
  return project.placements.every(({ productId }) => resolveProduct(productId));
}
