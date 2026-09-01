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
    "Search catalog equipment using combined filters. Returns the first 5 matches by default (up to 10), compact product summaries, the total match count, and truncation metadata.",
  inputSchema: searchProductsJsonSchema,
  annotations: { readOnlyHint: true },
  execute: createSearchProductsHandler(),
};

export const getProductDetailsWebMcpTool: WebMcpTool = {
  name: "get_product_details",
  title: "Get home gym equipment details",
  description: "Get the complete catalog record for one product ID returned by search_products.",
  inputSchema: getProductDetailsJsonSchema,
  annotations: { readOnlyHint: true },
  execute: createGetProductDetailsHandler(),
};

export const catalogWebMcpTools: readonly WebMcpTool[] = [
  searchProductsWebMcpTool,
  getProductDetailsWebMcpTool,
];

export type CatalogRegistrationResult = ToolSetRegistrationResult;

export async function registerCatalogTools(
  documentValue: Document,
  controller: AbortController,
): Promise<CatalogRegistrationResult> {
  return registerToolSet(documentValue, controller, catalogWebMcpTools);
}
