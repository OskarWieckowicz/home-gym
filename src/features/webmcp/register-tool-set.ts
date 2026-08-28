import type { WebMcpDocument, WebMcpModelContext, WebMcpTool } from "./types";

export type ToolSetRegistrationResult =
  | { readonly status: "ready" }
  | { readonly status: "unsupported" }
  | { readonly status: "aborted" }
  | { readonly status: "failed"; readonly reason: "registration-rejected" };

function getModelContext(documentValue: Document): WebMcpModelContext | undefined {
  const modelContext = (documentValue as WebMcpDocument).modelContext;
  return typeof modelContext?.registerTool === "function" ? modelContext : undefined;
}

export async function registerToolSet(
  documentValue: Document,
  controller: AbortController,
  tools: readonly WebMcpTool[],
): Promise<ToolSetRegistrationResult> {
  if (controller.signal.aborted) return { status: "aborted" };

  try {
    const modelContext = getModelContext(documentValue);
    if (!modelContext) return { status: "unsupported" };
    await Promise.all(
      tools.map((tool) =>
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
