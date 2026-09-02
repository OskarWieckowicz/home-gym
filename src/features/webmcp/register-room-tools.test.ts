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
  it("advertises optional suggestion defaults and explains hard bounds versus soft strategy", () => {
    for (const branch of suggestPlacementsJsonSchema.anyOf ?? []) {
      expect(branch.required).not.toContain("limit");
      expect(branch.required).not.toContain("strategy");
      expect(branch.properties?.limit).toMatchObject({ default: 3, minimum: 1, maximum: 10 });
      expect(branch.properties?.strategy).toMatchObject({
        default: "balanced",
        enum: ["balanced", "perimeter", "open-center"],
        description: expect.stringContaining("Soft ordering preference"),
      });
      expect(branch.properties?.region).toMatchObject({
        description: expect.stringContaining("Hard candidate search bounds"),
      });
    }
  });
  it("defines exactly twenty concise, unique, strict and correctly annotated tools", () => {
    const tools = createRoomWebMcpTools(createProjectStore(createDefaultProject()));

    expect(tools.map(({ name }) => name)).toEqual([
      "get_project_summary",
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
      "get_product_details",
      "place_product",
      "add_product_to_project",
      "place_project_item",
      "update_placement",
      "unplace_product",
      "remove_product",
      "suggest_placements",
    ]);
    expect(new Set(tools.map(({ name }) => name))).toHaveLength(20);
    for (const tool of tools) {
      expect(tool.description.length).toBeGreaterThan(40);
      expect(tool.description.length).toBeLessThanOrEqual(500);
      expectStrictObjectSchema(tool.inputSchema);
      expect(tool.execute).toBeTypeOf("function");
      expect(tool.annotations).toEqual(
        ["get_project_summary", "get_project_state", "validate_layout", "search_products", "get_product_details", "suggest_placements"].includes(tool.name)
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
      .toContain("version-6");
    expect(tools.find(({ name }) => name === "get_project_state")?.description)
      .toContain("equipment placements");
    expect(tools.find(({ name }) => name === "add_obstacle")?.description)
      .toContain("never infer clearance from a name");
    expect(tools.find(({ name }) => name === "validate_layout")?.description)
      .toContain("100 cm");
    expect(tools.find(({ name }) => name === "place_product")?.description)
      .toContain("flush");
    expect(tools.find(({ name }) => name === "remove_product")?.description)
      .toContain("projectItemId");
    const suggestionDescription = tools.find(({ name }) => name === "suggest_placements")?.description;
    expect(suggestionDescription).toContain("Region is a hard");
    expect(suggestionDescription).toContain("Strategy is a soft");
    expect(suggestionDescription).toContain("scoreBreakdown");
    expect(suggestionDescription).toContain("re-run for the next item");
    expect(suggestionDescription).toContain("validate_layout");
  });

  it("keeps complete product details available without leaving the creator", async () => {
    const tool = createRoomWebMcpTools(createProjectStore(createDefaultProject()))
      .find(({ name }) => name === "get_product_details");
    expect(await tool?.execute({ productId: "product_northstar_half_rack" }))
      .toMatchObject({
        ok: true,
        product: {
          id: "product_northstar_half_rack",
          useZone: expect.any(Object),
          requirements: expect.any(Object),
        },
      });
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
