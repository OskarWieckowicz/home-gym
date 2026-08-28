import type { Product } from "@/features/catalog/schemas";
import type { NormalizedCatalogFilters } from "@/features/catalog/queries";

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
    trainingGoals: [...product.trainingGoals],
    exercises: [...product.exercises],
  };
}

export function createSearchResult(
  filters: NormalizedCatalogFilters,
  products: readonly Product[],
) {
  return {
    ok: true as const,
    tool: "search_products" as const,
    filters: { ...filters },
    matchCount: products.length,
    products: products.map(createProductSummary),
  };
}

export function createProductDetailsResult(product: Product) {
  return {
    ok: true as const,
    tool: "get_product_details" as const,
    product: {
      ...product,
      dimensions: { ...product.dimensions },
      clearance: { ...product.clearance },
      exercises: [...product.exercises],
      trainingGoals: [...product.trainingGoals],
      muscleGroups: [...product.muscleGroups],
      requirements: { ...product.requirements },
      ...(product.constraints ? { constraints: [...product.constraints] } : {}),
    },
  };
}
