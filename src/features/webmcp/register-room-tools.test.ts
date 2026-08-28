import { describe, expect, it, vi } from "vitest";

import { createProjectStore } from "@/features/creator/store/project-store";
import { createDefaultProject } from "@/features/project/defaults";

import { createRoomWebMcpTools, registerRoomTools } from "./register-room-tools";
import type { WebMcpModelContext } from "./types";

function documentWith(modelContext?: WebMcpModelContext): Document {
  return { modelContext } as unknown as Document;
}

function expectStrictObjectSchema(schema: Readonly<Record<string, unknown>>) {
  if (Array.isArray(schema.anyOf)) {
    for (const branch of schema.anyOf) {
      expect(branch).toMatchObject({ type: "object", additionalProperties: false });
    }
    return;
  }
  expect(schema).toMatchObject({ type: "object", additionalProperties: false });
}

describe("room WebMCP tool definitions", () => {
  it("defines exactly seven unique, strict and correctly annotated tools", () => {
    const tools = createRoomWebMcpTools(createProjectStore(createDefaultProject()));

    expect(tools.map(({ name }) => name)).toEqual([
      "get_project_state",
      "configure_room",
      "update_project_settings",
      "add_obstacle",
      "update_obstacle",
      "remove_obstacle",
      "validate_layout",
    ]);
    expect(new Set(tools.map(({ name }) => name))).toHaveLength(7);
    for (const tool of tools) {
      expect(tool.description.length).toBeGreaterThan(40);
      expectStrictObjectSchema(tool.inputSchema);
      expect(tool.execute).toBeTypeOf("function");
      expect(tool.annotations).toEqual(
        ["get_project_state", "validate_layout"].includes(tool.name)
          ? { readOnlyHint: true }
          : undefined,
      );
    }
  });
});

describe("registerRoomTools", () => {
  it("registers the complete store-bound set with one signal", async () => {
    const registered: string[] = [];
    const registerTool = vi.fn<WebMcpModelContext["registerTool"]>(
      async (tool, options) => {
        registered.push(tool.name);
        expect(options?.signal).toBe(controller.signal);
      },
    );
    const controller = new AbortController();

    await expect(
      registerRoomTools(
        documentWith({ registerTool }),
        controller,
        createProjectStore(createDefaultProject()),
      ),
    ).resolves.toEqual({ status: "ready" });
    expect(registered).toHaveLength(7);
  });

  it("preserves unsupported and all-or-unavailable lifecycle behavior", async () => {
    const store = createProjectStore(createDefaultProject());
    await expect(
      registerRoomTools(documentWith(), new AbortController(), store),
    ).resolves.toEqual({ status: "unsupported" });

    const controller = new AbortController();
    const registerTool = vi
      .fn<WebMcpModelContext["registerTool"]>()
      .mockResolvedValue(undefined)
      .mockRejectedValueOnce(new DOMException("duplicate", "InvalidStateError"));
    await expect(
      registerRoomTools(documentWith({ registerTool }), controller, store),
    ).resolves.toEqual({ status: "failed", reason: "registration-rejected" });
    expect(controller.signal.aborted).toBe(true);
  });
});
