// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ScenePreviewProps } from "../scene/scene-preview";
import { useSceneEditing } from "../scene/use-scene-editing";
import { catalogProductResolver } from "../store/catalog-product-resolver";
import { useProjectStore } from "../store/project-store-context";
import { analyzeProject } from "@/features/project/validation/analyze-project";
import { createDefaultProject } from "@/features/project/defaults";
import { buildProjectSummary } from "@/features/project/summary/project-summary";
import { findProjectProductById } from "@/features/catalog/queries/project-products";

import { CreatorEditor } from "./creator-editor";
import { mockNativeDialog } from "./test-dialog";

mockNativeDialog();

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
  it("uses the normal placement command for a catalog intent, reuses an unplaced item and supports undo", async () => {
    const project = createDefaultProject();
    project.projectItems = [{ id: "project-item_bench", productId: "product_arc_adjustable_bench" }];
    render(<CreatorEditor initialProject={project} catalogProductId="product_arc_adjustable_bench" />);
    await screen.findByRole("button", { name: "Cancel placing Arc Adjustable Bench" });
    const store = (sceneProps.mock.lastCall![0] as ScenePreviewProps).store;
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
    expect(store.getState().project).toEqual(project);
    fireEvent.click(screen.getByRole("button", { name: "Scene place at centre" }));
    expect(store.getState().project.projectItems).toEqual(project.projectItems);
    expect(store.getState().project.placements).toHaveLength(1);
    expect(store.getState().project.placements[0].projectItemId).toBe("project-item_bench");
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(store.getState().project).toEqual(project);
  });

  it("activates wall-mounted catalog equipment without a purchase", async () => {
    render(<CreatorEditor initialProject={createDefaultProject()} catalogProductId="product_wall_mounted_punching_bag" />);
    await screen.findByRole("button", { name: "Cancel placing Wall-Mounted Punching Bag" });
    const props = sceneProps.mock.lastCall![0] as ScenePreviewProps;
    expect(props.activeProductId).toBe("product_wall_mounted_punching_bag");
    expect(props.store.getState()).toMatchObject({ revision: 0, canUndo: false });
    expect(props.store.getState().project.projectItems).toHaveLength(0);
  });
  it("locks equipment through the shared store and keeps manual controls, list actions and undo consistent", () => {
    const project = createDefaultProject();
    project.projectItems = [{ id: "project-item_rack", productId: "product_northstar_half_rack" }];
    project.placements = [{ id: "placement_rack", projectItemId: "project-item_rack", locked: false,
      position: { xCm: 80, zCm: 80 }, rotation: 0 }];
    render(<CreatorEditor initialProject={project} />);
    fireEvent.click(screen.getByRole("button", { name: "Scene select first" }));
    expect(screen.getByRole("heading", { name: "Northstar Half Rack" })).toBeTruthy();
    const before = sceneProps.mock.lastCall![0] as ScenePreviewProps;
    const lock = screen.getByRole("button", { name: "Lock position" });
    fireEvent.click(lock);
    expect(screen.getByRole("button", { name: "Lock position" }).getAttribute("aria-pressed")).toBe("true");
    expect(before.store.getState().project.placements[0].locked).toBe(true);
    expect(screen.getByRole("spinbutton", { name: "X (cm)" })).toHaveProperty("disabled", true);
    for (const name of ["Apply changes", "Rotate 90°", "Remove from project"]) {
      expect(screen.getByRole("button", { name })).toHaveProperty("disabled", true);
    }
    expect(screen.getByRole("button", { name: "Focus selected" })).toHaveProperty("disabled", false);
    const revision = before.store.getState().revision;
    act(() => { expect(before.store.getState().dispatch({ type: "PLACEMENT_UPDATED", payload: {
      placementId: "placement_rack", patch: { position: { xCm: 120, zCm: 120 } },
    } })).toMatchObject({ ok: false, error: { code: "ENTITY_LOCKED" } }); });
    expect(before.store.getState().revision).toBe(revision);
    fireEvent.click(screen.getByRole("tab", { name: "Project items" }));
    expect(screen.getByText("Placed · 0° · Locked")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Remove Northstar Half Rack from project" })).toHaveProperty("disabled", true);
    for (const button of screen.getAllByRole("button", { name: /Remove from room, keep on list/ })) {
      expect(button).toHaveProperty("disabled", true);
    }
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(before.store.getState().project.placements[0].locked).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Redo" }));
    expect(before.store.getState().project.placements[0].locked).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Lock position" }));
    expect(before.store.getState().project.placements[0].locked).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Rotate 90°" }));
    expect(before.store.getState().project.placements[0].rotation).toBe(90);
  });
  it("keeps selection, validation, camera and layer choice across presentation view without editing history", () => {
    const project = createDefaultProject();
    project.obstacles = [{ id: "obstacle_box", name: "Box", kind: "obstacle", rotation: 0, locked: false,
      position: { xCm: 100, zCm: 80 }, dimensions: { widthCm: 80, depthCm: 50, heightCm: 100 } }];
    render(<CreatorEditor initialProject={project} />);
    fireEvent.click(screen.getByRole("button", { name: "Scene select first" }));
    fireEvent.click(screen.getByRole("button", { name: "Show all use zones" }));
    const before = sceneProps.mock.lastCall![0] as ScenePreviewProps;
    const state = before.store.getState();
    const toggle = screen.getByRole("button", { name: "Presentation view" });
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(sceneProps.mock.lastCall![0]).toMatchObject({ presentationView: true,
      selectedId: before.selectedId, issues: before.issues, cameraPreset: before.cameraPreset, showAllUseZones: true });
    expect(screen.getByRole("button", { name: "Show all use zones" })).toHaveProperty("disabled", true);
    expect(screen.getByText("Add a door to check access.")).toBeTruthy();
    expect(before.store.getState()).toBe(state);
    fireEvent.click(toggle);
    expect(sceneProps.mock.lastCall![0]).toMatchObject({ presentationView: false, showAllUseZones: true });
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole("button", { name: "Place Northstar Half Rack" }));
    expect(sceneProps.mock.lastCall![0]).toMatchObject({ presentationView: false, activeProductId: "product_northstar_half_rack" });
    expect(before.store.getState()).toBe(state);
  });
  it("toggles all use zones without changing the project, selection, camera or history", () => {
    render(<CreatorEditor initialProject={createDefaultProject()} />);
    const initial = sceneProps.mock.lastCall![0] as ScenePreviewProps;
    const state = initial.store.getState();
    const toggle = screen.getByRole("button", { name: "Show all use zones" });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(initial.showAllUseZones).toBe(false);
    expect(screen.getByRole("button", { name: "Focus selected" })).toHaveProperty("disabled", true);
    fireEvent.click(toggle);
    expect(sceneProps.mock.lastCall![0]).toMatchObject({ showAllUseZones: true, selectedId: null, cameraPreset: initial.cameraPreset });
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(initial.store.getState()).toBe(state);
    fireEvent.click(screen.getByRole("button", { name: "2D" }));
    expect(screen.queryByRole("button", { name: "Show all use zones" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "3D" }));
    expect(sceneProps.mock.lastCall![0]).toMatchObject({ showAllUseZones: true });
    fireEvent.click(screen.getByRole("button", { name: "Show all use zones" }));
    expect(sceneProps.mock.lastCall![0]).toMatchObject({ showAllUseZones: false });
    expect(initial.store.getState()).toBe(state);
  });

  it("focuses a selected scene object explicitly and disables focus after it is removed", () => {
    const project = createDefaultProject();
    project.obstacles = [{ id: "obstacle_box", name: "Box", kind: "obstacle", rotation: 0, locked: false,
      position: { xCm: 100, zCm: 80 }, dimensions: { widthCm: 80, depthCm: 50, heightCm: 100 } }];
    render(<CreatorEditor initialProject={project} />);
    const initial = sceneProps.mock.lastCall![0] as ScenePreviewProps;
    const state = initial.store.getState();
    fireEvent.click(screen.getByRole("button", { name: "Scene select first" }));
    expect(sceneProps.mock.lastCall![0]).toMatchObject({ cameraPreset: initial.cameraPreset });
    const focus = screen.getByRole("button", { name: "Focus selected" });
    expect(focus).toHaveProperty("disabled", false);
    fireEvent.click(focus);
    const focused = (sceneProps.mock.lastCall![0] as ScenePreviewProps).cameraPreset;
    expect(focused).toMatchObject({ kind: "selection", sequence: 1, box: { dimensions: { x: 0.8, y: 1, z: 0.5 } } });
    expect(initial.store.getState()).toBe(state);
    fireEvent.click(screen.getByRole("button", { name: "Fit view" }));
    expect(sceneProps.mock.lastCall![0]).toMatchObject({ cameraPreset: { kind: "fit", sequence: 2 } });
    act(() => { initial.store.getState().dispatch({ type: "OBSTACLE_REMOVED", payload: { obstacleId: "obstacle_box" } }); });
    expect(focus).toHaveProperty("disabled", true);
    expect(sceneProps.mock.lastCall![0]).toMatchObject({ selectedId: null, cameraPreset: { kind: "fit", sequence: 2 } });
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(initial.store.getState().project.obstacles).toHaveLength(1);
    expect(initial.store.getState().canUndo).toBe(false);
  });

  it("keeps the cost visible, reuses an unplaced purchase and restores it with undo", () => {
    const project = createDefaultProject();
    project.projectItems = [{ id: "project-item_bench", productId: "product_arc_adjustable_bench" }];
    let placementSequence = 0;
    render(<CreatorEditor initialProject={project} dependencies={{ generatePlacementId: () => `placement_bench_${++placementSequence}` }} />);
    const cost = within(screen.getByRole("heading", { name: "Project cost" }).closest("section")!);
    const totalBefore = cost.getByRole("status").textContent;
    expect(cost.getByText("$325")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Project items, 1 not placed" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Place Arc Adjustable Bench" }));
    fireEvent.click(screen.getByRole("button", { name: "Scene preview target" }));
    const store = (sceneProps.mock.lastCall![0] as ScenePreviewProps).store;
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
    expect(cost.getByRole("status").textContent).toBe(totalBefore);
    fireEvent.click(screen.getByRole("button", { name: "Scene place at centre" }));
    expect(store.getState().project.projectItems).toHaveLength(1);
    expect(store.getState().project.placements[0].projectItemId).toBe("project-item_bench");
    expect(cost.getByRole("status").textContent).toBe(totalBefore);
    expect(screen.getByRole("tab", { name: "Project items" })).toBeTruthy();

    expect(screen.queryByRole("button", { name: /More actions/ })).toBeNull();
    const keep = screen.getByRole("button", { name: /Remove from room, keep on list/ });
    expect(within(screen.getByRole("complementary", { name: "Properties and validation" })).getByText("Total cost stays the same.")).toBeTruthy();
    keep.focus();
    fireEvent.click(keep);
    expect(document.activeElement).toBe(screen.getByRole("complementary", { name: "Properties and validation" }));
    expect(screen.getByRole("button", { name: "Place on plan" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Focus selected" })).toHaveProperty("disabled", true);
    expect(store.getState().project.placements).toHaveLength(0);
    expect(cost.getByRole("status").textContent).toBe(totalBefore);

    fireEvent.click(screen.getByRole("button", { name: "Place Arc Adjustable Bench" }));
    fireEvent.click(screen.getByRole("button", { name: "Scene place at centre" }));
    expect(store.getState().project.projectItems).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(store.getState().project.placements).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Redo" }));
    expect(store.getState().project.placements).toHaveLength(1);
    expect(cost.getByRole("status").textContent).toBe(totalBefore);
  });

  it("edits budget in existing settings and counts accessories without pending placement", () => {
    render(<CreatorEditor initialProject={createDefaultProject()} />);
    const cost = within(screen.getByRole("heading", { name: "Project cost" }).closest("section")!);
    fireEvent.click(cost.getByRole("button", { name: "Edit budget" }));
    expect(screen.getByRole("heading", { name: "Project settings" })).toBeTruthy();
    change("Budget", "0");
    fireEvent.click(screen.getByRole("button", { name: "Apply settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Add to list: Signal Resistance Bands" }));
    fireEvent.click(screen.getByRole("button", { name: "Add to list: Signal Resistance Bands" }));
    const store = (sceneProps.mock.lastCall![0] as ScenePreviewProps).store;
    const state = store.getState();
    const summary = buildProjectSummary(state.project, state.validation, findProjectProductById);
    expect(state.project.projectItems).toHaveLength(2);
    expect(state.project.placements).toHaveLength(0);
    expect(cost.getByRole("status").textContent).toContain(summary.totals.totalPriceLabel);
    expect(cost.getByRole("status").textContent).toContain(summary.totals.balanceLabel);
    expect(screen.getByRole("tab", { name: "Project items" })).toBeTruthy();
    expect(within(screen.getByRole("complementary", { name: "Properties and validation" })).getByText("No placement needed")).toBeTruthy();
    act(() => { store.getState().replaceProject(createDefaultProject()); });
    expect(cost.getByText("$0")).toBeTruthy();
  });

  it("cancels equipment placement without creating a purchase or changing cost", () => {
    render(<CreatorEditor initialProject={createDefaultProject()} />);
    const store = (sceneProps.mock.lastCall![0] as ScenePreviewProps).store;
    fireEvent.click(screen.getByRole("button", { name: "Place Northstar Half Rack" }));
    fireEvent.click(screen.getByRole("button", { name: "Scene preview target" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel placing Northstar Half Rack" }));
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false, project: { projectItems: [], placements: [] } });
    fireEvent.click(screen.getByRole("button", { name: "Place Northstar Half Rack" }));
    fireEvent.click(screen.getByRole("button", { name: "2D" }));
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false, project: { projectItems: [], placements: [] } });
  });

  it("switches presentation views without creating project history", () => {
    const project = createDefaultProject();
    project.projectItems = [
      { id: "project-item_rack", productId: "product_northstar_half_rack" },
      { id: "project-item_bench", productId: "product_arc_adjustable_bench" },
    ];
    project.placements = project.projectItems.map((item, index) => ({ locked: false,
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
    fireEvent.click(screen.getByRole("button", { name: "Edit budget" }));
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

    expect(screen.getByText("Selected equipment")).toBeTruthy();
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
