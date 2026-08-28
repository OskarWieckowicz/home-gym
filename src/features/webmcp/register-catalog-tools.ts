import {
  createGetProductDetailsHandler,
  createSearchProductsHandler,
} from "./catalog-tool-handlers";
import {
  getProductDetailsJsonSchema,
  searchProductsJsonSchema,
} from "./catalog-tool-schemas";
import type { WebMcpDocument, WebMcpModelContext, WebMcpTool } from "./types";

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

export type CatalogRegistrationResult =
  | { readonly status: "ready" }
  | { readonly status: "unsupported" }
  | { readonly status: "aborted" }
  | { readonly status: "failed"; readonly reason: "registration-rejected" };

function getModelContext(documentValue: Document): WebMcpModelContext | undefined {
  const modelContext = (documentValue as WebMcpDocument).modelContext;
  return typeof modelContext?.registerTool === "function" ? modelContext : undefined;
}

export async function registerCatalogTools(
  documentValue: Document,
  controller: AbortController,
): Promise<CatalogRegistrationResult> {
  const modelContext = getModelContext(documentValue);
  if (!modelContext) return { status: "unsupported" };

  try {
    await Promise.all(
      catalogWebMcpTools.map((tool) =>
        modelContext.registerTool(tool, { signal: controller.signal }),
      ),
    );
    return controller.signal.aborted ? { status: "aborted" } : { status: "ready" };
  } catch {
    if (controller.signal.aborted) return { status: "aborted" };
    controller.abort();
    return { status: "failed", reason: "registration-rejected" };
  }
}
