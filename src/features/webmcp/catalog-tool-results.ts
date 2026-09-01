import {
  getEffectiveAnchoring,
  getEffectiveMounting,
  getEffectiveRequiredHeightCm,
  type NormalizedCatalogFilters,
} from "@/features/catalog/queries";
import type { Product } from "@/features/catalog/schemas";

import type { InputIssue } from "./catalog-tool-schemas";

export type CatalogToolName = "search_products" | "get_product_details";
export type CatalogToolErrorCode =
  | "INVALID_INPUT"
  | "PRODUCT_NOT_FOUND"
  | "EXECUTION_FAILED";

export type CatalogToolError = {
  readonly ok: false;
  readonly tool: CatalogToolName;
  readonly error: {
    readonly code: CatalogToolErrorCode;
    readonly message: string;
    readonly issues?: readonly InputIssue[];
  };
};

export function createToolError(
  tool: CatalogToolName,
  code: CatalogToolErrorCode,
  message: string,
  issues?: readonly InputIssue[],
): CatalogToolError {
  return {
    ok: false,
    tool,
    error: { code, message, ...(issues?.length ? { issues } : {}) },
  };
}

export function createProductSummary(product: Product) {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: product.price,
    dimensions: { ...product.dimensions },
    requiredHeightCm: getEffectiveRequiredHeightCm(product),
    anchoring: getEffectiveAnchoring(product),
    mounting: getEffectiveMounting(product),
    placementMode: product.placementMode,
    trainingGoals: [...product.trainingGoals],
    exercises: [...product.exercises],
  };
}

export function createSearchResult(
  filters: NormalizedCatalogFilters,
  products: readonly Product[],
  limit: number,
) {
  const returnedProducts = products.slice(0, limit);

  return {
    ok: true as const,
    tool: "search_products" as const,
    filters: { ...filters, limit },
    matchCount: products.length,
    returnedCount: returnedProducts.length,
    truncated: returnedProducts.length < products.length,
    products: returnedProducts.map(createProductSummary),
  };
}

export function createProductDetailsResult(product: Product) {
  return {
    ok: true as const,
    tool: "get_product_details" as const,
    product: {
      ...product,
      dimensions: { ...product.dimensions },
      useZone: { ...product.useZone },
      exercises: [...product.exercises],
      trainingGoals: [...product.trainingGoals],
      muscleGroups: [...product.muscleGroups],
      requirements: { ...product.requirements },
      ...(product.constraints ? { constraints: [...product.constraints] } : {}),
      mounting: getEffectiveMounting(product),
    },
  };
}
