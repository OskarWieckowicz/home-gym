import { describe, expect, it, vi } from "vitest";

import { registerToolSet } from "./register-tool-set";
import type { WebMcpModelContext, WebMcpTool } from "./types";

const tool: WebMcpTool = {
  name: "example",
  description: "Example tool used to verify the shared registration lifecycle.",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  execute: () => ({}),
};

function documentWith(modelContext?: WebMcpModelContext): Document {
  return { modelContext } as unknown as Document;
}

describe("registerToolSet", () => {
  it("registers the original descriptor and options when no observer is supplied", async () => {
    const registerTool = vi.fn<WebMcpModelContext["registerTool"]>(() => Promise.resolve());
    const controller = new AbortController();

    await expect(
      registerToolSet(documentWith({ registerTool }), controller, [tool]),
    ).resolves.toEqual({ status: "ready" });

    expect(registerTool).toHaveBeenCalledOnce();
    expect(registerTool.mock.calls[0]?.[0]).toBe(tool);
    expect(registerTool.mock.calls[0]?.[1]).toEqual({ signal: controller.signal });
  });

  it("does not register anything when the lifecycle is already aborted", async () => {
    const registerTool = vi.fn<WebMcpModelContext["registerTool"]>();
    const controller = new AbortController();
    controller.abort();

    await expect(
      registerToolSet(documentWith({ registerTool }), controller, [tool]),
    ).resolves.toEqual({ status: "aborted" });
    expect(registerTool).not.toHaveBeenCalled();
  });

  it("reports a late registration resolution as aborted", async () => {
    let resolveRegistration: (() => void) | undefined;
    const registerTool = vi.fn<WebMcpModelContext["registerTool"]>(
      () => new Promise<void>((resolve) => { resolveRegistration = resolve; }),
    );
    const controller = new AbortController();
    const registration = registerToolSet(
      documentWith({ registerTool }),
      controller,
      [tool],
    );

    controller.abort();
    resolveRegistration?.();
    await expect(registration).resolves.toEqual({ status: "aborted" });
  });

  it("converts a throwing modelContext getter into a failed lifecycle", async () => {
    const documentValue = {} as Document;
    Object.defineProperty(documentValue, "modelContext", {
      get: () => { throw new Error("broken browser API"); },
    });
    const controller = new AbortController();

    await expect(registerToolSet(documentValue, controller, [tool])).resolves.toEqual({
      status: "failed",
      reason: "registration-rejected",
    });
    expect(controller.signal.aborted).toBe(true);
  });
});
