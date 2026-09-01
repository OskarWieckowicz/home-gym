import { describe, expect, it, vi } from "vitest";

import {
  catalogWebMcpTools,
  getProductDetailsWebMcpTool,
  registerCatalogTools,
  searchProductsWebMcpTool,
} from "./register-catalog-tools";
import type { WebMcpModelContext } from "./types";

function documentWith(modelContext?: WebMcpModelContext): Document {
  return { modelContext } as unknown as Document;
}

describe("catalog WebMCP tool definitions", () => {
  it("defines exactly two unique read-only tools with strict schemas", () => {
    expect(catalogWebMcpTools.map(({ name }) => name)).toEqual([
      "search_products",
      "get_product_details",
    ]);
    expect(new Set(catalogWebMcpTools.map(({ name }) => name))).toHaveLength(2);
    for (const tool of catalogWebMcpTools) {
      expect(tool.description.length).toBeGreaterThan(20);
      expect(tool.description.length).toBeLessThanOrEqual(500);
      expect(tool.annotations).toEqual({ readOnlyHint: true });
      expect(tool.inputSchema).toMatchObject({
        type: "object",
        additionalProperties: false,
      });
      expect(tool.execute).toBeTypeOf("function");
    }
  });

  it("exports both reusable catalog descriptors", () => {
    expect(catalogWebMcpTools).toEqual([
      searchProductsWebMcpTool,
      getProductDetailsWebMcpTool,
    ]);
  });
});

describe("registerCatalogTools", () => {
  it("reports unsupported documents without throwing", async () => {
    await expect(
      registerCatalogTools(documentWith(), new AbortController()),
    ).resolves.toEqual({ status: "unsupported" });
  });

  it("registers both tools with one shared lifecycle signal", async () => {
    const registerTool = vi.fn<WebMcpModelContext["registerTool"]>(async () => undefined);
    const controller = new AbortController();

    await expect(
      registerCatalogTools(documentWith({ registerTool }), controller),
    ).resolves.toEqual({ status: "ready" });
    expect(registerTool).toHaveBeenCalledTimes(2);
    expect(registerTool.mock.calls.map(([, options]) => options?.signal)).toEqual([
      controller.signal,
      controller.signal,
    ]);
  });

  it("aborts all registrations when one registration fails", async () => {
    const registerTool = vi
      .fn<WebMcpModelContext["registerTool"]>()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new DOMException("duplicate", "InvalidStateError"));
    const controller = new AbortController();

    await expect(
      registerCatalogTools(documentWith({ registerTool }), controller),
    ).resolves.toEqual({ status: "failed", reason: "registration-rejected" });
    expect(controller.signal.aborted).toBe(true);
  });

  it("treats cleanup aborts as quiet", async () => {
    const controller = new AbortController();
    const registerTool = vi.fn(async () => {
      controller.abort();
      throw new DOMException("aborted", "AbortError");
    });

    await expect(
      registerCatalogTools(documentWith({ registerTool }), controller),
    ).resolves.toEqual({ status: "aborted" });
  });
});
