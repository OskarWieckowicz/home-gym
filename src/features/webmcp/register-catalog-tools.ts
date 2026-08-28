import {
  createGetProductDetailsHandler,
  createSearchProductsHandler,
} from "./catalog-tool-handlers";
import {
  getProductDetailsJsonSchema,
  searchProductsJsonSchema,
} from "./catalog-tool-schemas";
import { registerToolSet, type ToolSetRegistrationResult } from "./register-tool-set";
import type { WebMcpTool } from "./types";

export const catalogWebMcpTools: readonly WebMcpTool[] = [
  {
    name: "search_products",
    title: "Search home gym equipment",
    description:
      "Search the Home Gym Creator catalog by text, category, maximum PLN price, and training goal.",
    inputSchema: searchProductsJsonSchema,
    annotations: { readOnlyHint: true },
    execute: createSearchProductsHandler(),
  },
  {
    name: "get_product_details",
    title: "Get home gym equipment details",
    description:
      "Get the complete validated catalog record for one canonical product ID returned by search_products.",
    inputSchema: getProductDetailsJsonSchema,
    annotations: { readOnlyHint: true },
    execute: createGetProductDetailsHandler(),
  },
];

export type CatalogRegistrationResult = ToolSetRegistrationResult;

export async function registerCatalogTools(
  documentValue: Document,
  controller: AbortController,
): Promise<CatalogRegistrationResult> {
  return registerToolSet(documentValue, controller, catalogWebMcpTools);
}
