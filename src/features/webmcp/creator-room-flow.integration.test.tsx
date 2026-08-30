// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CreatorEditor } from "@/features/creator/components/creator-editor";
import type { ScenePreviewProps } from "@/features/creator/scene/scene-preview";
import { createDefaultProject } from "@/features/project/defaults";
import type { ProjectCommand } from "@/features/project/schemas/project-command";

import type { WebMcpModelContext, WebMcpTool } from "./types";

let originalModelContext: PropertyDescriptor | undefined;
const sceneState = vi.hoisted(() => vi.fn());
// Keep real registered tools and the shared editor/store, not WebGL in jsdom.
vi.mock("next/dynamic", () => ({
  default: () => function SceneWebMcpProbe(props: ScenePreviewProps) {
    sceneState(props);
    return <span aria-label="Agent scene revision">{props.store.getState().revision}</span>;
  },
}));

beforeEach(() => {
  sceneState.mockClear();
  originalModelContext = Object.getOwnPropertyDescriptor(document, "modelContext");
});

afterEach(() => {
  cleanup();
  if (originalModelContext) {
    Object.defineProperty(document, "modelContext", originalModelContext);
  } else {
    Reflect.deleteProperty(document, "modelContext");
  }
});

function setNumber(name: string, value: string) {
  fireEvent.change(screen.getByRole("spinbutton", { name }), {
    target: { value },
  });
}

describe("creator WebMCP shared editing flow", () => {
  it("suggests and evaluates without mutation, applies four placements visibly, and undoes the whole batch", async () => {
    const tools = new Map<string, WebMcpTool>();
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: { registerTool: async (tool: WebMcpTool) => { tools.set(tool.name, tool); } },
    });
    let nextId = 0;
    render(<CreatorEditor initialProject={createDefaultProject()} dependencies={{
      generatePlacementId: () => `placement_batch_${++nextId}`,
      generateProjectItemId: () => `project-item_batch_${++nextId}`,
    }} />);
    await waitFor(() => expect(tools.size).toBe(20));
    const execute = async (name: string, input: unknown) => {
      let result: unknown;
      await act(async () => { result = await tools.get(name)!.execute(input); });
      return result;
    };
    const before = await execute("get_project_state", {});
    const suggestion = await execute("suggest_placements", {
      productId: "product_groundwork_exercise_mat", rotations: [0], limit: 1,
      region: { minXCm: 0, minZCm: 0, maxXCm: 0, maxZCm: 0 },
    }) as { ok: boolean; candidates: { command: ProjectCommand }[] };
    expect(suggestion.ok).toBe(true);
    expect(suggestion.candidates).toHaveLength(1);
    const changes = [suggestion.candidates[0].command, ...[80, 160, 240].map((xCm) => ({
      type: "PRODUCT_PLACED",
      payload: { productId: "product_groundwork_exercise_mat", position: { xCm, zCm: 0 }, rotation: 0 },
    }))];
    expect(await execute("evaluate_layout_changes", { changes })).toMatchObject({ ok: true, applies: true, revision: 0 });
    expect(await execute("get_project_state", {})).toEqual(before);
    fireEvent.click(screen.getByRole("tab", { name: "Project items" }));
    expect(screen.getByText("No equipment in the project yet.")).toBeTruthy();
    expect(await execute("apply_layout_changes", { changes })).toMatchObject({ ok: true, changed: true, revision: 1 });
    expect(screen.getByRole("button", { name: "3D" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByLabelText("Agent scene revision").textContent).toBe("1");
    expect((sceneState.mock.lastCall![0] as ScenePreviewProps).project.placements).toHaveLength(4);
    expect(screen.getAllByRole("button", { name: /Groundwork Exercise MatPlaced · 0°/ })).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: /Undo/ }));
    expect(screen.getByText("No equipment in the project yet.")).toBeTruthy();
    expect(await execute("get_project_state", {})).toMatchObject({
      revision: 2, canUndo: false, canRedo: true, project: { placements: [], projectItems: [] },
    });
  });

});

describe("existing creator WebMCP shared editing flow", () => {
  it("keeps manual UI, registered tools, validation, revision and history in one state", async () => {
    const tools = new Map<string, WebMcpTool>();
    const registerTool = vi.fn<WebMcpModelContext["registerTool"]>(async (tool) => {
      tools.set(tool.name, tool);
    });
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: { registerTool } satisfies WebMcpModelContext,
    });

    const { container } = render(
      <CreatorEditor
        dependencies={{ generateObstacleId: () => "obstacle_agent_rack" }}
        initialProject={createDefaultProject()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "2D" }));
    await waitFor(() => expect(tools.size).toBe(20));

    fireEvent.click(screen.getByRole("tab", { name: "Room" }));
    fireEvent.click(screen.getByRole("button", { name: "Project settings" }));
    setNumber("Budget", "12500");
    fireEvent.click(screen.getByRole("checkbox", { name: "Strength" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply settings" }));

    const execute = async <T,>(name: string, input: unknown): Promise<T> => {
      const tool = tools.get(name);
      if (!tool) throw new Error(`Tool ${name} was not registered.`);
      let result: unknown;
      await act(async () => {
        result = await tool.execute(input);
      });
      return result as T;
    };

    const manualState = await execute<{
      revision: number;
      project: { budget: number; trainingGoals: string[] };
      canUndo: boolean;
    }>("get_project_state", {});
    expect(manualState).toMatchObject({
      revision: 1,
      project: { budget: 12500, trainingGoals: ["strength"] },
      canUndo: true,
    });

    const added = await execute<{
      revision: number;
      obstacleId: string;
      obstacle: { name: string };
    }>("add_obstacle", {
      kind: "obstacle",
      name: "Agent rack",
      position: { xCm: 20, zCm: 20 },
      dimensions: { widthCm: 100, depthCm: 80, heightCm: 210 },
      rotation: 0,
      locked: false,
    });
    expect(added).toMatchObject({
      revision: 2,
      obstacleId: "obstacle_agent_rack",
      obstacle: { name: "Agent rack" },
    });
    expect(
      screen.getByRole("button", { name: /Agent rack, physical obstacle/ }),
    ).toBeTruthy();
    expect(screen.getByRole("group", { name: "Top-down editable room plan" })).toBeTruthy();

    const invalidUpdate = await execute<{
      revision: number;
      validation: { valid: boolean; issueCount: number };
    }>("update_obstacle", {
      obstacleId: "obstacle_agent_rack",
      patch: { position: { xCm: 350, zCm: 20 } },
    });
    expect(invalidUpdate).toMatchObject({
      revision: 3,
      validation: { valid: false, issueCount: 2 },
    });
    expect(screen.getByRole("button", { name: "Layout checks" }).getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("heading", { name: "Errors" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Layout checks" }));
    expect(screen.getByRole("heading", { name: "Errors" })).toBeTruthy();
    expect(container.textContent).toContain("Agent rack is outside the room on x");

    const validation = await execute<{
      revision: number;
      valid: boolean;
      issueCount: number;
      issues: Array<{ code: string; entityIds: string[] }>;
    }>("validate_layout", {});
    expect(validation).toMatchObject({
      revision: 3,
      valid: false,
      issueCount: 2,
      issues: expect.arrayContaining([
        expect.objectContaining({
          code: "OUTSIDE_ROOM",
          entityIds: ["obstacle_agent_rack"],
        }),
      ]),
    });

    const corrected = await execute<{
      revision: number;
      validation: { valid: boolean };
    }>("update_obstacle", {
      obstacleId: "obstacle_agent_rack",
      patch: { position: { xCm: 250, zCm: 20 } },
    });
    expect(corrected).toMatchObject({ revision: 4, validation: { valid: true } });
    expect(container.textContent).toContain("Access cannot be evaluated until the room has a door");

    fireEvent.click(screen.getByRole("button", { name: /Undo/ }));
    expect(container.textContent).toContain("Agent rack is outside the room on x");
    expect(screen.getByRole("button", { name: /Redo/ })).not.toHaveProperty(
      "disabled",
      true,
    );

    fireEvent.click(screen.getByRole("button", { name: /Redo/ }));
    expect(container.textContent).toContain("Access cannot be evaluated until the room has a door");

    const finalState = await execute<{
      revision: number;
      project: { obstacles: Array<{ id: string; position: { xCm: number } }> };
      canRedo: boolean;
    }>("get_project_state", {});
    expect(finalState).toMatchObject({
      revision: 6,
      project: {
        obstacles: [
          { id: "obstacle_agent_rack", position: { xCm: 250 } },
        ],
      },
      canRedo: false,
    });
  });

  it("searches, places, moves, rotates and removes equipment in the live editor", async () => {
    const tools = new Map<string, WebMcpTool>();
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool: vi.fn<WebMcpModelContext["registerTool"]>(async (tool) => {
          tools.set(tool.name, tool);
        }),
      } satisfies WebMcpModelContext,
    });

    render(
      <CreatorEditor
        dependencies={{
          generatePlacementId: () => "placement_agent-rack",
          generateProjectItemId: () => "project-item_agent-rack",
        }}
        initialProject={createDefaultProject()}
      />,
    );
    await waitFor(() => expect(tools.size).toBe(20));

    const execute = async <T,>(name: string, input: unknown): Promise<T> => {
      const tool = tools.get(name);
      if (!tool) throw new Error(`Tool ${name} was not registered.`);
      let result: unknown;
      await act(async () => {
        result = await tool.execute(input);
      });
      return result as T;
    };

    const search = await execute<{
      matchCount: number;
      products: Array<{ productId: string; name: string }>;
    }>("search_products", { query: "Northstar Half Rack" });
    expect(search).toMatchObject({
      matchCount: 1,
      products: [{ productId: "product_northstar_half_rack" }],
    });

    const placed = await execute<{ placementId: string; revision: number }>(
      "place_product",
      {
        productId: search.products[0].productId,
        position: { xCm: 20, zCm: 20 },
        rotation: 0,
      },
    );
    expect(placed).toMatchObject({ placementId: "placement_agent-rack", revision: 1 });
    fireEvent.click(screen.getByRole("tab", { name: "Project items" }));
    expect(screen.getByRole("button", { name: /Northstar Half RackPlaced · 0°/ }))
      .toBeTruthy();

    const updated = await execute<{
      revision: number;
      placement: { position: { xCm: number; zCm: number }; rotation: number };
    }>("update_placement", {
      placementId: placed.placementId,
      patch: { position: { xCm: 150, zCm: 80 }, rotation: 90 },
    });
    expect(updated).toMatchObject({
      revision: 2,
      placement: { position: { xCm: 150, zCm: 80 }, rotation: 90 },
    });
    expect(screen.getByRole("button", { name: /Northstar Half RackPlaced · 90°/ }))
      .toBeTruthy();

    expect(
      await execute("remove_product", { projectItemId: "project-item_agent-rack" }),
    ).toMatchObject({
      changed: true,
      revision: 3,
      removedProjectItemId: "project-item_agent-rack",
      removedPlacementId: placed.placementId,
      removedProductId: search.products[0].productId,
    });
    expect(screen.getByText("No equipment in the project yet.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Undo/ }));
    expect(screen.getByRole("button", { name: /Northstar Half RackPlaced · 90°/ }))
      .toBeTruthy();
  });
});
