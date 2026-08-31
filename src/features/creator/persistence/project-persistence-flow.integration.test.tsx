// @vitest-environment jsdom

import { StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CreatorEditor } from "../components/creator-editor";
import { mockNativeDialog } from "../components/test-dialog";

mockNativeDialog();
import type { ScenePreviewProps } from "../scene/scene-preview";
import { createDefaultProject } from "@/features/project/defaults";
import { createDemoProject } from "@/features/project/demo-project";
import { serializeProject } from "@/features/project/serialization/project-codec";
import { toProjectItemsAndPlacements } from "@/features/project/validation/test-placed-equipment";
import type {
  WebMcpModelContext,
  WebMcpTool,
} from "@/features/webmcp/types";

import {
  createLocalProjectStorage,
  type ProjectStorageLike,
} from "./local-project-storage";

let originalModelContext: PropertyDescriptor | undefined;
const sceneRestores = vi.hoisted(() => vi.fn());
// Persistence integration verifies shared state; WebGL rendering has separate coverage.
vi.mock("next/dynamic", () => ({
  default: () => function ScenePersistenceProbe(props: ScenePreviewProps) {
    sceneRestores(props);
    return <span aria-label="Restored scene revision">{props.store.getState().revision}</span>;
  },
}));

beforeEach(() => {
  sceneRestores.mockClear();
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

describe("persistent manual and agent editing flow", () => {
  it("seeds demo before tools register, shares manual and agent history, then restores the edited demo", async () => {
    const memory = createMemoryStorage(projectJson({ ...createDefaultProject(), budget: 999 }));
    const tools = new Map<string, WebMcpTool>();
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool: vi.fn<WebMcpModelContext["registerTool"]>(async (tool) => {
          tools.set(tool.name, tool);
        }),
      } satisfies WebMcpModelContext,
    });
    const first = render(<CreatorEditor startMode="demo" storage={memory.adapter} />);
    const confirm = await screen.findByRole("button", { name: "Replace with sample" });
    expect(tools.size).toBe(0);
    expect(sceneRestores).not.toHaveBeenCalled();
    expect(memory.storage.setItem).not.toHaveBeenCalled();
    fireEvent.click(confirm);
    await waitFor(() => expect(tools.size).toBe(21));
    expect(sceneRestores.mock.lastCall![0]).toMatchObject({ project: createDemoProject() });
    expect(await executeTool(tools, "get_project_state", {})).toMatchObject({
      revision: 0, canUndo: false, project: { budget: 10000 },
    });
    expect(memory.storage.setItem).toHaveBeenCalledOnce();
    fireEvent.change(screen.getByRole("spinbutton", { name: "Width (cm)" }), {
      target: { value: "450" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply room" }));
    expect(await executeTool(tools, "get_project_state", {})).toMatchObject({
      revision: 1, project: { room: { widthCm: 450 } },
    });
    await executeTool(tools, "update_project_settings", { budget: 12000 });
    fireEvent.click(screen.getByRole("button", { name: /Undo/ }));
    expect(await executeTool(tools, "get_project_state", {})).toMatchObject({
      project: { budget: 10000, room: { widthCm: 450 } },
    });
    fireEvent.click(screen.getByRole("button", { name: /Redo/ }));
    first.unmount();
    tools.clear();
    render(<CreatorEditor storage={memory.adapter} />);
    await waitFor(() => expect(tools.size).toBe(21));
    expect(sceneRestores.mock.lastCall![0]).toMatchObject({
      project: { ...createDemoProject(), budget: 12000, room: { widthCm: 450, depthCm: 400, heightCm: 240 } },
    });
    expect(await executeTool(tools, "get_project_state", {})).toMatchObject({
      revision: 0, canUndo: false, project: { budget: 12000, room: { widthCm: 450 } },
    });
  });

  it("restores before WebMCP registration and persists agent mutation plus manual history", async () => {
    const seeded = { ...createDefaultProject(), budget: 12_500 };
    const memory = createMemoryStorage(projectJson(seeded));
    const tools = new Map<string, WebMcpTool>();
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool: vi.fn<WebMcpModelContext["registerTool"]>(async (tool) => {
          tools.set(tool.name, tool);
        }),
      } satisfies WebMcpModelContext,
    });

    const first = render(
      <CreatorEditor
        dependencies={{
          generateObstacleId: () => "obstacle_agent_rack",
          generatePlacementId: () => "placement_agent_rack",
        }}
        persistence
        storage={memory.adapter}
      />,
    );
    await waitFor(() => expect(tools.size).toBe(21));
    expect(screen.getByRole("button", { name: "3D" }).getAttribute("aria-pressed")).toBe("true");
    expect(sceneRestores.mock.lastCall![0]).toMatchObject({ project: seeded });
    // Preserve this existing SVG visibility scenario as an explicit 2D workflow.
    fireEvent.click(screen.getByRole("button", { name: "2D" }));

    const initial = await executeTool<{
      revision: number;
      project: { budget: number; obstacles: unknown[] };
      canUndo: boolean;
    }>(tools, "get_project_state", {});
    expect(initial).toMatchObject({
      revision: 0,
      project: { budget: 12_500, obstacles: [] },
      canUndo: false,
    });
    expect(memory.storage.setItem).not.toHaveBeenCalled();

    await executeTool(tools, "add_obstacle", {
      kind: "obstacle",
      name: "Agent rack",
      position: { xCm: 20, zCm: 20 },
      dimensions: { widthCm: 100, depthCm: 80, heightCm: 210 },
      rotation: 0,
      locked: false,
    });
    expect(memory.storage.setItem).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: /Agent rack, physical obstacle/ })).toBeTruthy();

    await executeTool(tools, "place_product", {
      productId: "product_northstar_half_rack",
      position: { xCm: 160, zCm: 90 },
      rotation: 90,
    });
    expect(memory.storage.setItem).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: /Northstar Half Rack, equipment/ }))
      .toBeTruthy();

    await executeTool(tools, "get_project_state", {});
    expect(memory.storage.setItem).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole("button", { name: /Undo/ }));
    expect(memory.storage.setItem).toHaveBeenCalledTimes(3);
    fireEvent.click(screen.getByRole("button", { name: /Redo/ }));
    expect(memory.storage.setItem).toHaveBeenCalledTimes(4);

    first.unmount();
    tools.clear();
    render(
      <CreatorEditor
        dependencies={{ generateObstacleId: () => "obstacle_unused" }}
        persistence
        storage={memory.adapter}
      />,
    );
    await waitFor(() => expect(tools.size).toBe(21));

    const restored = await executeTool<{
      revision: number;
      project: {
        budget: number;
        obstacles: Array<{ id: string; name: string }>;
        placements: Array<{ id: string; productId: string; rotation: number }>;
      };
      canUndo: boolean;
    }>(tools, "get_project_state", {});
    expect(restored).toMatchObject({
      revision: 0,
      project: {
        budget: 12_500,
        obstacles: [{ id: "obstacle_agent_rack", name: "Agent rack" }],
        placements: [{
          id: "placement_agent_rack",
          productId: "product_northstar_half_rack",
          rotation: 90,
        }],
      },
      canUndo: false,
    });
  });

  it("registers one real twenty-one-tool set after a Strict Mode restore", async () => {
    const registerTool = vi.fn<WebMcpModelContext["registerTool"]>(async () => undefined);
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: { registerTool } satisfies WebMcpModelContext,
    });
    const memory = createMemoryStorage(null);

    render(
      <StrictMode>
        <CreatorEditor persistence storage={memory.adapter} />
      </StrictMode>,
    );

    await waitFor(() => expect(registerTool).toHaveBeenCalledTimes(21));
    await act(async () => Promise.resolve());
    expect(registerTool).toHaveBeenCalledTimes(21);
    expect(memory.storage.setItem).not.toHaveBeenCalled();
  });

  it("keeps import and reset durable and immediately visible to live WebMCP reads", async () => {
    const memory = createMemoryStorage(null);
    const tools = new Map<string, WebMcpTool>();
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool: vi.fn<WebMcpModelContext["registerTool"]>(async (tool) => {
          tools.set(tool.name, tool);
        }),
      } satisfies WebMcpModelContext,
    });
    const imported = {
      ...createDefaultProject(),
      budget: 18_000,
      ...toProjectItemsAndPlacements([{
        id: "placement_imported_rack",
        productId: "product_northstar_half_rack",
        position: { xCm: 100, zCm: 80 },
        rotation: 90,
      }]),
    };

    let mounted = render(<CreatorEditor persistence storage={memory.adapter} />);
    await waitFor(() => expect(tools.size).toBe(21));
    fireEvent.click(screen.getByRole("button", { name: "2D" }));
    fireEvent.click(screen.getByRole("button", { name: "Project" }));
    fireEvent.click(screen.getByRole("button", { name: "Import" }));
    fireEvent.change(screen.getByLabelText("Choose project JSON to import"), {
      target: {
        files: [
          {
            name: "project.json",
            size: 200,
            text: vi.fn(async () => projectJson(imported)),
          },
        ],
      },
    });
    await screen.findByText("Project imported.");
    expect(memory.storage.setItem).toHaveBeenCalledOnce();
    expect(await executeTool(tools, "get_project_state", {})).toMatchObject({
      revision: 1,
      project: {
        budget: 18_000,
        placements: [{ id: "placement_imported_rack", rotation: 90 }],
      },
    });
    expect(screen.getByRole("button", { name: /Northstar Half Rack, equipment/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Project items" }));
    expect(screen.getByRole("button", { name: /Northstar Half RackPlaced/ })).toBeTruthy();

    mounted.unmount();
    tools.clear();
    mounted = render(<CreatorEditor persistence storage={memory.adapter} />);
    await waitFor(() => expect(tools.size).toBe(21));
    expect(await executeTool(tools, "get_project_state", {})).toMatchObject({
      revision: 0,
      project: {
        budget: 18_000,
        placements: [{ id: "placement_imported_rack", rotation: 90 }],
      },
      canUndo: false,
    });

    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Project" }));
    fireEvent.click(screen.getByRole("button", { name: /Reset/ }));
    expect(memory.storage.setItem).toHaveBeenCalledTimes(2);
    expect(await executeTool(tools, "get_project_state", {})).toMatchObject({
      revision: 1,
      project: { budget: 10_000 },
      canUndo: true,
    });

    mounted.unmount();
    tools.clear();
    render(<CreatorEditor persistence storage={memory.adapter} />);
    await waitFor(() => expect(tools.size).toBe(21));
    expect(await executeTool(tools, "get_project_state", {})).toMatchObject({
      revision: 0,
      project: { budget: 10_000 },
      canUndo: false,
    });
  });
});

async function executeTool<T = unknown>(
  tools: ReadonlyMap<string, WebMcpTool>,
  name: string,
  input: unknown,
): Promise<T> {
  const tool = tools.get(name);
  if (!tool) throw new Error(`Tool ${name} was not registered.`);
  let result: unknown;
  await act(async () => {
    result = await tool.execute(input);
  });
  return result as T;
}

function projectJson(project: ReturnType<typeof createDefaultProject>): string {
  const serialized = serializeProject(project);
  if (!serialized.success) throw new Error("Invalid project fixture.");
  return serialized.json;
}

function createMemoryStorage(initialValue: string | null) {
  let value = initialValue;
  const storage = {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key: string, nextValue: string) => {
      value = nextValue;
    }),
    removeItem: vi.fn(() => {
      value = null;
    }),
  } satisfies ProjectStorageLike;
  return { storage, adapter: createLocalProjectStorage(storage) };
}
