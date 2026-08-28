import {
  findProductById,
  normalizeCatalogFilters,
  searchProducts,
  type CatalogFilters,
} from "@/features/catalog/queries";
import type { Product } from "@/features/catalog/schemas";

import {
  getProductDetailsInputSchema,
  mapInputIssues,
  searchProductsInputSchema,
} from "./catalog-tool-schemas";
import {
  createProductDetailsResult,
  createSearchResult,
  createToolError,
} from "./catalog-tool-results";
import type { WebMcpExecuteOptions } from "./types";

export type CatalogToolService = {
  readonly searchProducts: (filters: CatalogFilters) => readonly Product[];
  readonly findProductById: (productId: string) => Product | undefined;
};

const defaultService: CatalogToolService = { searchProducts, findProductById };

function executionCancelled(tool: "search_products" | "get_product_details") {
  return createToolError(tool, "EXECUTION_FAILED", "Tool execution was cancelled.");
}

export function createSearchProductsHandler(service: CatalogToolService = defaultService) {
  return (input: unknown, options?: WebMcpExecuteOptions) => {
    if (options?.signal?.aborted) return executionCancelled("search_products");

    const parsed = searchProductsInputSchema.safeParse(input);
    if (!parsed.success) {
      return createToolError(
        "search_products",
        "INVALID_INPUT",
        "Search filters are invalid.",
        mapInputIssues(parsed.error),
      );
    }

    try {
      const filters = normalizeCatalogFilters(parsed.data);
      return createSearchResult(filters, service.searchProducts(parsed.data));
    } catch {
      return createToolError(
        "search_products",
        "EXECUTION_FAILED",
        "Product search could not be completed.",
      );
    }
  };
}

export function createGetProductDetailsHandler(service: CatalogToolService = defaultService) {
  return (input: unknown, options?: WebMcpExecuteOptions) => {
    if (options?.signal?.aborted) return executionCancelled("get_product_details");

    const parsed = getProductDetailsInputSchema.safeParse(input);
    if (!parsed.success) {
      return createToolError(
        "get_product_details",
        "INVALID_INPUT",
        "Product ID is invalid.",
        mapInputIssues(parsed.error),
      );
    }

    try {
      const product = service.findProductById(parsed.data.productId);
      if (!product) {
        return createToolError(
          "get_product_details",
          "PRODUCT_NOT_FOUND",
          "No catalog product exists with this product ID.",
        );
      }
      return createProductDetailsResult(product);
    } catch {
      return createToolError(
        "get_product_details",
        "EXECUTION_FAILED",
        "Product details could not be retrieved.",
      );
    }
  };
}
