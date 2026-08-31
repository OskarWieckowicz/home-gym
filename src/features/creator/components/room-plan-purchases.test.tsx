// @vitest-environment jsdom

import { useEffect } from "react";
import { act, cleanup, createEvent, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createDefaultProject } from "@/features/project/defaults";
import type { GymProject } from "@/features/project/schemas/project";
import type { ProjectStore } from "../store/project-store";
import { ProjectStoreProvider, useProjectStoreApi } from "../store/project-store-context";
import { EQUIPMENT_DRAG_TYPE } from "./equipment-catalog-panel";
import { RoomPlan } from "./room-plan";

const productId = "product_northstar_half_rack";
const firstItem = { id: "project-item_first", productId };
const secondItem = { id: "project-item_second", productId };
const initialProject: GymProject = { ...createDefaultProject(), projectItems: [firstItem, secondItem] };

function StoreCapture({ capture }: { readonly capture: (store: ProjectStore) => void }) {
  const store = useProjectStoreApi();
  useEffect(() => capture(store), [capture, store]);
  return null;
}

function setup(project = initialProject, activeProjectItemId: string | null = null) {
  let store!: ProjectStore;
  const onPlacementError = vi.fn();
  const onCancelPlacement = vi.fn();
  render(
    <ProjectStoreProvider initialProject={project}>
      <StoreCapture capture={(value) => { store = value; }} />
      <RoomPlan activeProductId={activeProjectItemId ? null : productId} activeProjectItemId={activeProjectItemId}
        activeTool={null} selectedId={null} placementError="" onSelect={vi.fn()}
        onPlacementComplete={vi.fn()} onPlacementError={onPlacementError} onCancelPlacement={onCancelPlacement} />
    </ProjectStoreProvider>,
  );
  const plan = screen.getByRole("group", { name: "Top-down editable room plan" });
  vi.spyOn(plan, "getBoundingClientRect").mockReturnValue({
    bottom: 560, height: 560, left: 0, right: 760, top: 0, width: 760,
    x: 0, y: 0, toJSON: () => undefined,
  });
  return { store, plan, onPlacementError, onCancelPlacement };
}

type PlacementMethod = "click" | "Enter" | "drop";
function place(plan: HTMLElement, method: PlacementMethod) {
  if (method === "Enter") fireEvent.keyDown(plan, { key: "Enter" });
  else if (method === "click") fireEvent.pointerDown(plan, { button: 0, clientX: 380, clientY: 280 });
  else {
    const drop = createEvent.drop(plan, { dataTransfer: { getData: () => productId } });
    Object.defineProperties(drop, { clientX: { value: 380 }, clientY: { value: 280 } });
    fireEvent(plan, drop);
  }
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("2D placement purchase identity", () => {
  it.each(["click", "Enter", "drop"] as const)("reuses the first unplaced purchase through %s, in one undo step", (method) => {
    const { store, plan, onPlacementError } = setup();
    place(plan, method);
    expect(onPlacementError).not.toHaveBeenCalled();
    expect(store.getState().project.projectItems).toEqual(initialProject.projectItems);
    expect(store.getState().project.placements).toMatchObject([{ projectItemId: firstItem.id }]);
    expect(store.getState().revision).toBe(1);
    act(() => { store.getState().undo(); });
    expect(store.getState().project).toEqual(initialProject);
    expect(store.getState().canUndo).toBe(false);
  });

  it.each(["click", "Enter", "drop"] as const)("reads the latest store before %s even before React rerenders", (method) => {
    const { store, plan } = setup();
    act(() => {
      store.getState().dispatch({ type: "PROJECT_ITEM_PLACED", payload: {
        projectItemId: firstItem.id, position: { xCm: 0, zCm: 0 }, rotation: 0,
      } });
      place(plan, method);
    });
    expect(store.getState().project.projectItems).toEqual(initialProject.projectItems);
    expect(store.getState().project.placements.map((placement) => placement.projectItemId)).toEqual([firstItem.id, secondItem.id]);
    expect(store.getState().revision).toBe(2);
  });

  it.each(["removed", "placed"] as const)("never replaces a %s explicit purchase with a new one", (change) => {
    const { store, plan, onPlacementError } = setup(initialProject, firstItem.id);
    act(() => {
      if (change === "removed") store.getState().dispatch({ type: "PROJECT_ITEM_REMOVED", payload: { projectItemId: firstItem.id } });
      else store.getState().dispatch({ type: "PROJECT_ITEM_PLACED", payload: {
        projectItemId: firstItem.id, position: { xCm: 0, zCm: 0 }, rotation: 0,
      } });
      place(plan, "Enter");
    });
    expect(onPlacementError).toHaveBeenLastCalledWith(change === "removed"
      ? "This project item is unavailable." : "This project item is already placed.");
    expect(store.getState().revision).toBe(1);
    expect(store.getState().project.placements).toHaveLength(change === "removed" ? 0 : 1);
    expect(store.getState().project.projectItems).toHaveLength(change === "removed" ? 1 : 2);
  });

  it("does not add a purchase or history when cancelled", () => {
    const { store, plan, onCancelPlacement } = setup(createDefaultProject());
    fireEvent.keyDown(plan, { key: "Escape" });
    expect(onCancelPlacement).toHaveBeenCalledOnce();
    expect(store.getState().project).toEqual(createDefaultProject());
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
  });

  it("ignores an empty catalog drop without changing purchases", () => {
    const { store, plan } = setup();
    fireEvent.drop(plan, { dataTransfer: { types: [EQUIPMENT_DRAG_TYPE], getData: () => "" } });
    expect(store.getState().project).toEqual(initialProject);
    expect(store.getState().revision).toBe(0);
  });
});
