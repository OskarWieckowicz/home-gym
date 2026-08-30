import { describe, expect, it, vi } from "vitest";

import { createProjectStore } from "@/features/creator/store/project-store";
import { createDefaultProject } from "@/features/project/defaults";

import { createRoomWebMcpTools, registerRoomTools } from "./register-room-tools";
import type { WebMcpModelContext } from "./types";
import { suggestPlacementsJsonSchema } from "./batch-tool-schemas";

function documentWith(modelContext?: WebMcpModelContext): Document {
  return { modelContext } as unknown as Document;
}

function expectStrictObjectSchema(schema: Readonly<Record<string, unknown>>) {
  const branches = Array.isArray(schema.anyOf)
    ? schema.anyOf
    : Array.isArray(schema.oneOf)
      ? schema.oneOf
      : null;
  if (branches) {
    for (const branch of branches) {
      expect(branch).toMatchObject({ type: "object", additionalProperties: false });
    }
    return;
  }
  expect(schema).toMatchObject({ type: "object", additionalProperties: false });
}

describe("room WebMCP tool definitions", () => {
  it("advertises the suggestion limit as optional, matching runtime defaults", () => {
    for (const branch of suggestPlacementsJsonSchema.anyOf ?? []) {
      expect(branch.required).not.toContain("limit");
      expect(branch.properties?.limit).toMatchObject({ default: 3, minimum: 1, maximum: 10 });
    }
  });
  it("defines exactly twenty unique, strict and correctly annotated tools", () => {
    const tools = createRoomWebMcpTools(createProjectStore(createDefaultProject()));

    expect(tools.map(({ name }) => name)).toEqual([
      "get_project_state",
      "configure_room",
      "update_project_settings",
      "add_obstacle",
      "update_obstacle",
      "remove_obstacle",
      "add_wall_element",
      "update_wall_element",
      "remove_wall_element",
      "validate_layout",
      "search_products",
      "place_product",
      "add_product_to_project",
      "place_project_item",
      "update_placement",
      "unplace_product",
      "remove_product",
      "suggest_placements",
      "evaluate_layout_changes",
      "apply_layout_changes",
    ]);
    expect(new Set(tools.map(({ name }) => name))).toHaveLength(20);
    for (const tool of tools) {
      expect(tool.description.length).toBeGreaterThan(40);
      expectStrictObjectSchema(tool.inputSchema);
      expect(tool.execute).toBeTypeOf("function");
      expect(tool.annotations).toEqual(
        ["get_project_state", "validate_layout", "search_products", "suggest_placements", "evaluate_layout_changes"].includes(tool.name)
          ? { readOnlyHint: true }
          : undefined,
      );
    }
    for (const toolName of [
      "add_wall_element",
      "update_wall_element",
      "remove_wall_element",
    ]) {
      expect(tools.find(({ name }) => name === toolName)?.description).toContain(
        "unavailable zone",
      );
    }
    expect(tools.find(({ name }) => name === "get_project_state")?.description)
      .toContain("version-4");
    expect(tools.find(({ name }) => name === "get_project_state")?.description)
      .toContain("equipment placements");
    expect(tools.find(({ name }) => name === "validate_layout")?.description)
      .toContain("errors and warnings");
    expect(tools.find(({ name }) => name === "validate_layout")?.description)
      .toContain("100 cm");
    expect(tools.find(({ name }) => name === "get_project_state")?.description)
      .toContain("reachability");
    expect(tools.find(({ name }) => name === "place_product")?.description)
      .toContain("Unreachable");
    expect(tools.find(({ name }) => name === "place_product")?.description)
      .toContain("flush");
    expect(tools.find(({ name }) => name === "remove_product")?.description)
      .toContain("projectItemId");
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
    expect(registered).toHaveLength(20);
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
