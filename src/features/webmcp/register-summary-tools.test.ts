import { describe, expect, it, vi } from "vitest";

import { createProjectStore } from "@/features/creator/store/project-store";
import { createDemoProject } from "@/features/project/demo-project";

import { createSummaryWebMcpTools, registerSummaryTools } from "./register-summary-tools";
import type { WebMcpModelContext } from "./types";

describe("summary WebMCP tool set", () => {
  it("exposes only the deterministic summary read and leaves the store unchanged", async () => {
    const store = createProjectStore(createDemoProject());
    const before = store.getState();
    const tools = createSummaryWebMcpTools(store);
    expect(tools.map(({ name }) => name)).toEqual(["get_project_summary"]);
    for (const tool of tools) {
      expect(tool.annotations).toEqual({ readOnlyHint: true });
      expect(tool.inputSchema).toMatchObject({
        type: "object", properties: {}, additionalProperties: false,
      });
      expect(await tool.execute({})).toMatchObject({ ok: true });
      expect(await tool.execute({ mutate: true })).toMatchObject({
        ok: false, error: { code: "INVALID_INPUT" },
      });
    }
    expect(store.getState()).toBe(before);
  });

  it("registers the subset with a single cleanup signal", async () => {
    const registerTool = vi.fn<WebMcpModelContext["registerTool"]>(async () => undefined);
    const controller = new AbortController();
    const documentValue = { modelContext: { registerTool } } as unknown as Document;
    await expect(registerSummaryTools(
      documentValue, controller, createProjectStore(createDemoProject()),
    )).resolves.toEqual({ status: "ready" });
    expect(registerTool.mock.calls.map(([tool]) => tool.name)).toEqual([
      "get_project_summary",
    ]);
    expect(registerTool.mock.calls.every(([, options]) => options?.signal === controller.signal))
      .toBe(true);
  });

  it("rolls back the subset on failed registration", async () => {
    const registerTool = vi.fn<WebMcpModelContext["registerTool"]>()
      .mockRejectedValueOnce(new Error("registration unavailable"));
    const controller = new AbortController();
    await expect(registerSummaryTools(
      { modelContext: { registerTool } } as unknown as Document,
      controller, createProjectStore(createDemoProject()),
    )).resolves.toEqual({ status: "failed", reason: "registration-rejected" });
    expect(controller.signal.aborted).toBe(true);
  });
});
