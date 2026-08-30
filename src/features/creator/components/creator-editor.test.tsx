// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ScenePreviewProps } from "../scene/scene-preview";
import { useSceneEditing } from "../scene/use-scene-editing";
import { catalogProductResolver } from "../store/catalog-product-resolver";
import { useProjectStore } from "../store/project-store-context";
import { analyzeProject } from "@/features/project/validation/analyze-project";
import { createDefaultProject } from "@/features/project/defaults";

import { CreatorEditor } from "./creator-editor";

const { sceneProps } = vi.hoisted(() => ({ sceneProps: vi.fn() }));

// Exercise the editor-to-scene props boundary, not WebGL under jsdom.
vi.mock("next/dynamic", () => ({
  default: () => function ScenePreviewProbe(props: ScenePreviewProps) {
    const revision = useProjectStore((state) => state.revision);
    const { controller, snapshot } = useSceneEditing(props.store, props);
    sceneProps(props);
    return <>
      <output aria-label="Scene store revision">{revision}</output>
      <output aria-label="Scene draft">{snapshot.command?.type ?? "none"}</output>
      <span data-testid="scene-error">{props.placementError}</span>
      <button onClick={controller.placeCenter}>Scene place at centre</button>
      <button onClick={() => props.onSelect(props.project.obstacles[0]?.id ?? props.project.placements[0]?.id ?? null)}>Scene select first</button>
      <button onClick={() => controller.pointerMove({ pointerId: 1, clientX: 200, clientY: 160 }, { point: { xCm: 200, zCm: 160 }, entityId: null })}>Scene preview target</button>
      <button onClick={() => props.onPlacementError("Target unavailable")}>Scene report error</button>
      <button onClick={props.onFallback}>Scene fallback</button>
    </>;
  },
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  sceneProps.mockClear();
});

function change(name: string, value: string) {
  fireEvent.change(screen.getByRole("spinbutton", { name }), { target: { value } });
}

describe("CreatorEditor", () => {
  it("switches presentation views without creating project history", () => {
    const project = createDefaultProject();
    project.projectItems = [
      { id: "project-item_rack", productId: "product_northstar_half_rack" },
      { id: "project-item_bench", productId: "product_arc_adjustable_bench" },
    ];
    project.placements = project.projectItems.map((item, index) => ({
      id: index === 0 ? "placement_rack" : "placement_bench",
      projectItemId: item.id, position: { xCm: 100, zCm: 100 }, rotation: 0,
    }));
    render(<CreatorEditor initialProject={project} />);
    fireEvent.click(screen.getByRole("button", { name: "2D" }));
    fireEvent.keyDown(screen.getByRole("button", { name: /^Northstar Half Rack, equipment/ }), { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "3D" }));
    const expectedIssues = analyzeProject(project, { resolveProduct: catalogProductResolver }).issues;
    expect(expectedIssues.some((issue) => issue.severity === "error" && issue.entityIds.includes("placement_rack") && issue.entityIds.includes("placement_bench"))).toBe(true);
    expect(sceneProps).toHaveBeenLastCalledWith(expect.objectContaining({ project, selectedId: "placement_rack", issues: expectedIssues }));
    expect(screen.getByLabelText("Scene store revision").textContent).toBe("0");

    fireEvent.click(screen.getByRole("tab", { name: "Project items" }));
    fireEvent.click(screen.getByRole("button", { name: /Arc Adjustable Bench.*Placed/ }));
    expect(sceneProps).toHaveBeenLastCalledWith(expect.objectContaining({ project, selectedId: "placement_bench", issues: expectedIssues }));
    expect(screen.getByLabelText("Scene store revision").textContent).toBe("0");

    // Inspector edits remain normal commands; the still-mounted scene gets fresh issues.
    change("X (cm)", "270");
    change("Z (cm)", "170");
    fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
    const updated = sceneProps.mock.lastCall![0] as ScenePreviewProps;
    expect(updated.project).not.toEqual(project);
    expect(updated.issues).toEqual(analyzeProject(updated.project, { resolveProduct: catalogProductResolver }).issues);
    expect(updated.issues).not.toEqual(expectedIssues);
    fireEvent.click(screen.getByRole("button", { name: /Undo/ }));
    expect(sceneProps).toHaveBeenLastCalledWith(expect.objectContaining({ project, selectedId: "placement_bench", issues: expectedIssues }));
    expect(screen.getByRole("button", { name: "3D" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: /Undo/ })).toHaveProperty("disabled", true);
    fireEvent.click(screen.getByRole("button", { name: "2D" }));
    expect(screen.getByRole("group", { name: "Top-down editable room plan" })).toBeTruthy();
  });

  it("places floor areas directly and preserves locking, validation, undo and redo", () => {
    const ids = ["obstacle_wardrobe", "obstacle_zone"];
    const { container } = render(<CreatorEditor dependencies={{ generateObstacleId: () => ids.shift() ?? "obstacle_fallback" }} initialProject={createDefaultProject()} />);
    fireEvent.click(screen.getByRole("button", { name: "2D" }));
    const plan = screen.getByRole("group", { name: "Top-down editable room plan" });
    Object.defineProperty(plan, "getBoundingClientRect", { value: () => ({
      bottom: 560, height: 560, left: 0, right: 760, top: 0, width: 760,
      x: 0, y: 0, toJSON: () => undefined,
    }) });

    fireEvent.click(screen.getByRole("tab", { name: "Room" }));
    fireEvent.click(screen.getByRole("button", { name: "Project settings" }));
    change("Budget", "12500");
    fireEvent.click(screen.getByRole("checkbox", { name: "Strength" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply settings" }));
    expect(screen.getByRole("button", { name: /Undo/ })).not.toHaveProperty("disabled", true);

    fireEvent.click(screen.getByRole("button", { name: "Physical obstacle" }));
    fireEvent.pointerDown(plan, { button: 0, clientX: 300, clientY: 230 });
    change("X (cm)", "50");
    change("Z (cm)", "50");
    change("Width (cm)", "180");
    change("Depth (cm)", "60");
    fireEvent.click(screen.getByRole("checkbox", { name: "Lock after applying" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));

    expect(screen.getByRole("button", { name: "Unlock" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Remove/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Unlock" }));
    expect(screen.getByRole("button", { name: /Remove/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Unavailable zone" }));
    expect(screen.getByRole("button", { name: /Physical obstacle, physical obstacle/ })).toHaveProperty("tabIndex", -1);
    fireEvent.pointerDown(plan, { button: 0, clientX: 330, clientY: 240 });

    fireEvent.click(screen.getByRole("button", { name: "Layout checks" }));
    expect(screen.getByRole("heading", { name: "Errors" })).toBeTruthy();
    expect(container.textContent).toContain("conflict with an unavailable zone");
    expect(screen.getByRole("button", { name: /Physical obstacle, physical obstacle/ })).toHaveProperty("tabIndex", 0);
    expect(screen.queryByRole("button", { name: "Add to room" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Undo/ }));
    expect(container.textContent).not.toContain("conflict with an unavailable zone");
    fireEvent.click(screen.getByRole("button", { name: /Redo/ }));
    expect(container.textContent).toContain("conflict with an unavailable zone");
  });

  it("adds simple wall elements without creating unavailable zones", () => {
    const wallIds = ["wall-element_door", "wall-element_window"];
    render(<CreatorEditor dependencies={{
      generateObstacleId: () => "obstacle_fallback",
      generateWallElementId: () => wallIds.shift() ?? "wall-element_fallback",
    }} initialProject={createDefaultProject()} />);
    fireEvent.click(screen.getByRole("button", { name: "2D" }));
    const plan = screen.getByRole("group", { name: "Top-down editable room plan" });
    Object.defineProperty(plan, "getBoundingClientRect", { value: () => ({
      bottom: 560, height: 560, left: 0, right: 760, top: 0, width: 760,
      x: 0, y: 0, toJSON: () => undefined,
    }) });

    fireEvent.click(screen.getByRole("tab", { name: "Room" }));
    fireEvent.click(screen.getByRole("button", { name: "Door" }));
    fireEvent.pointerDown(plan, { button: 0, clientX: 250, clientY: 48 });
    expect(screen.getByRole("button", { name: /Door, door, top wall/ })).toBeTruthy();
    expect(screen.getByText("Wall elements do not create an unavailable zone.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Window" }));
    fireEvent.pointerDown(plan, { button: 0, clientX: 500, clientY: 48 });
    expect(screen.getByRole("button", { name: /Window, window, top wall/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Project items" }));
    expect(screen.getByText("No obstacles or unavailable zones yet.")).toBeTruthy();
  });

  it("rejects invalid form values without creating history", () => {
    render(<CreatorEditor initialProject={createDefaultProject()} />);
    change("Width (cm)", "0");
    fireEvent.click(screen.getByRole("button", { name: "Apply room" }));
    expect(screen.getByRole("alert").textContent).toContain("positive whole centimeters");
    expect(screen.getByRole("button", { name: /Undo/ })).toHaveProperty("disabled", true);
  });

  it("places, rotates, removes, and restores catalog equipment", () => {
    render(<CreatorEditor dependencies={{
      generatePlacementId: () => "placement_northstar",
    }} initialProject={createDefaultProject()} />);
    fireEvent.click(screen.getByRole("button", { name: "2D" }));
    const plan = screen.getByRole("group", { name: "Top-down editable room plan" });
    Object.defineProperty(plan, "getBoundingClientRect", { value: () => ({
      bottom: 560, height: 560, left: 0, right: 760, top: 0, width: 760,
      x: 0, y: 0, toJSON: () => undefined,
    }) });

    fireEvent.click(screen.getByRole("button", { name: "Place Northstar Half Rack" }));
    fireEvent.pointerDown(plan, { button: 0, clientX: 300, clientY: 230 });

    expect(screen.getByRole("heading", { name: "Selected equipment" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Northstar Half Rack, equipment/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Rotate 90°" }));
    expect(screen.getByRole("button", { name: /Northstar Half Rack, equipment, 90 degrees/ })).toBeTruthy();

    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Remove from project" }));
    expect(screen.queryByRole("button", { name: /Northstar Half Rack, equipment/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Undo/ }));
    expect(screen.getByRole("button", { name: /Northstar Half Rack, equipment, 90 degrees/ })).toBeTruthy();
  });

  it("opens in 3D, creates through scene callbacks, selects the inspector, and shares undo", () => {
    render(<CreatorEditor initialProject={createDefaultProject()} dependencies={{ generateObstacleId: () => "obstacle_scene" }} />);
    expect(screen.getByRole("button", { name: "3D" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.queryByRole("group", { name: "Top-down editable room plan" })).toBeNull();
    expect(screen.getByLabelText("Scene store revision").textContent).toBe("0");
    fireEvent.click(screen.getByRole("tab", { name: "Room" }));
    fireEvent.click(screen.getByRole("button", { name: "Physical obstacle" }));
    expect(sceneProps.mock.lastCall![0]).toMatchObject({ activeTool: "obstacle", activeProductId: null, activeProjectItemId: null });
    fireEvent.click(screen.getByRole("button", { name: "Scene place at centre" }));
    expect(screen.getByLabelText("Scene store revision").textContent).toBe("1");
    expect(sceneProps.mock.lastCall![0]).toMatchObject({ selectedId: "obstacle_scene", activeTool: null });
    expect(screen.getByRole("button", { name: "Apply changes" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Room dimensions" }));
    fireEvent.click(screen.getByRole("button", { name: "Scene select first" }));
    expect(screen.getByRole("button", { name: "Apply changes" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(sceneProps.mock.lastCall![0]).toMatchObject({ project: { obstacles: [] }, selectedId: null });
    expect(screen.getByRole("button", { name: "Undo" })).toHaveProperty("disabled", true);
  });

  it("cancels placement preview and errors on a view switch without changing revision", () => {
    render(<CreatorEditor initialProject={createDefaultProject()} />);
    fireEvent.click(screen.getByRole("tab", { name: "Room" }));
    fireEvent.click(screen.getByRole("button", { name: "Physical obstacle" }));
    fireEvent.click(screen.getByRole("button", { name: "Scene preview target" }));
    fireEvent.click(screen.getByRole("button", { name: "Scene report error" }));
    expect(screen.getByLabelText("Scene draft").textContent).toBe("OBSTACLE_ADDED");
    expect(screen.getByTestId("scene-error").textContent).toBe("Target unavailable");
    const store = (sceneProps.mock.lastCall![0] as ScenePreviewProps).store;
    fireEvent.click(screen.getByRole("button", { name: "2D" }));
    expect(screen.getByRole("button", { name: "Physical obstacle" }).getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "3D" }));
    expect(screen.getByLabelText("Scene draft").textContent).toBe("none");
    expect(screen.getByTestId("scene-error").textContent).toBe("");
    expect((sceneProps.mock.lastCall![0] as ScenePreviewProps).store).toBe(store);
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
  });

  it("recovers the same project and selection in 2D without replacing the store", () => {
    render(<CreatorEditor initialProject={createDefaultProject()} dependencies={{ generateObstacleId: () => "obstacle_scene" }} />);
    fireEvent.click(screen.getByRole("tab", { name: "Room" }));
    fireEvent.click(screen.getByRole("button", { name: "Physical obstacle" }));
    fireEvent.click(screen.getByRole("button", { name: "Scene place at centre" }));
    const store = (sceneProps.mock.lastCall![0] as ScenePreviewProps).store;
    fireEvent.click(screen.getByRole("button", { name: "Scene fallback" }));
    expect(screen.getByRole("group", { name: "Top-down editable room plan" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Apply changes" })).toBeTruthy();
    expect(store.getState().revision).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: "3D" }));
    expect((sceneProps.mock.lastCall![0] as ScenePreviewProps).store).toBe(store);
    expect(sceneProps.mock.lastCall![0]).toMatchObject({ selectedId: "obstacle_scene" });
  });

  it("cancels a draft on sidebar navigation but preserves an existing selection and history", () => {
    render(<CreatorEditor initialProject={createDefaultProject()} dependencies={{ generateObstacleId: () => "obstacle_scene" }} />);
    fireEvent.click(screen.getByRole("tab", { name: "Room" }));
    fireEvent.click(screen.getByRole("button", { name: "Physical obstacle" }));
    fireEvent.click(screen.getByRole("button", { name: "Scene preview target" }));
    expect(screen.getByLabelText("Scene draft").textContent).toBe("OBSTACLE_ADDED");
    fireEvent.click(screen.getByRole("tab", { name: "Equipment" }));
    expect(screen.getByLabelText("Scene draft").textContent).toBe("none");
    expect(screen.getByLabelText("Scene store revision").textContent).toBe("0");
    expect(screen.getByRole("button", { name: "Apply room" })).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Room" }));
    fireEvent.click(screen.getByRole("button", { name: "Physical obstacle" }));
    fireEvent.click(screen.getByRole("button", { name: "Scene place at centre" }));
    fireEvent.click(screen.getByRole("tab", { name: "Project items" }));
    expect(sceneProps.mock.lastCall![0]).toMatchObject({ selectedId: "obstacle_scene" });
    expect(screen.getByRole("button", { name: "Apply changes" })).toBeTruthy();
    expect(screen.getByLabelText("Scene store revision").textContent).toBe("1");
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(sceneProps.mock.lastCall![0]).toMatchObject({ project: { obstacles: [] }, selectedId: null });
    expect(screen.getByRole("button", { name: "Apply room" })).toBeTruthy();
  });

  it("groups view, history and camera controls with the viewport without editing the project", () => {
    render(<CreatorEditor initialProject={createDefaultProject()} />);
    const controls = screen.getByRole("group", { name: "View controls" });
    for (const name of ["2D", "3D", "Undo", "Redo", "Fit view"]) {
      expect(within(controls).getByRole("button", { name })).toBeTruthy();
    }
    expect(screen.queryByRole("button", { name: "Top view" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Reset view" })).toBeNull();
    const store = (sceneProps.mock.lastCall![0] as ScenePreviewProps).store;
    fireEvent.click(within(controls).getByRole("button", { name: "Fit view" }));
    expect(sceneProps.mock.lastCall![0]).toMatchObject({ cameraPreset: { kind: "fit" } });
    fireEvent.click(within(controls).getByRole("button", { name: "Camera views" }));
    fireEvent.click(screen.getByRole("button", { name: "Top view" }));
    expect(sceneProps.mock.lastCall![0]).toMatchObject({ cameraPreset: { kind: "top" } });
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
    fireEvent.click(within(controls).getByRole("button", { name: "2D" }));
    expect(screen.queryByRole("button", { name: "Fit view" })).toBeNull();
    expect(within(controls).getByRole("button", { name: "Undo" })).toBeTruthy();
  });
});
