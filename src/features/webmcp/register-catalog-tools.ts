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

export const searchProductsWebMcpTool: WebMcpTool = {
  name: "search_products",
  title: "Search home gym equipment",
  description:
    "Search home gym equipment by text, category, price, stored dimensions, training goal, exact exercise, available ceiling height, and effective anchoring requirement. All supplied filters are combined.",
  inputSchema: searchProductsJsonSchema,
  annotations: { readOnlyHint: true },
  execute: createSearchProductsHandler(),
};

export const catalogWebMcpTools: readonly WebMcpTool[] = [
  searchProductsWebMcpTool,
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
