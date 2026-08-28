// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CreatorEditor } from "@/features/creator/components/creator-editor";
import { createDefaultProject } from "@/features/project/defaults";

import type { WebMcpModelContext, WebMcpTool } from "./types";

let originalModelContext: PropertyDescriptor | undefined;

beforeEach(() => {
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
    await waitFor(() => expect(tools.size).toBe(10));

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
      validation: { valid: false, issueCount: 1 },
    });
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
      issueCount: 1,
      issues: [{ code: "OUTSIDE_ROOM", entityIds: ["obstacle_agent_rack"] }],
    });

    const corrected = await execute<{
      revision: number;
      validation: { valid: boolean };
    }>("update_obstacle", {
      obstacleId: "obstacle_agent_rack",
      patch: { position: { xCm: 250, zCm: 20 } },
    });
    expect(corrected).toMatchObject({ revision: 4, validation: { valid: true } });
    expect(container.textContent).toContain("No layout conflicts found");

    fireEvent.click(screen.getByRole("button", { name: /Undo/ }));
    expect(container.textContent).toContain("Agent rack is outside the room on x");
    expect(screen.getByRole("button", { name: /Redo/ })).not.toHaveProperty(
      "disabled",
      true,
    );

    fireEvent.click(screen.getByRole("button", { name: /Redo/ }));
    expect(container.textContent).toContain("No layout conflicts found");

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
});
