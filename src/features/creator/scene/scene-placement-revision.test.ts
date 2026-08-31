import { afterEach, describe, expect, it, vi } from "vitest";
import { createDefaultProject } from "@/features/project/defaults";
import { createProjectStore } from "../store/project-store";
import { SceneEditController, type SceneControllerOptions } from "./scene-edit-controller";

const productId = "product_northstar_half_rack";
const point = { xCm: 200, zCm: 160 };
const cleanups: (() => void)[] = [];
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()));

function setup() {
  const store = createProjectStore(createDefaultProject());
  const options: SceneControllerOptions = {
    selectedId: null, activeTool: null, activeProductId: productId, activeProjectItemId: null,
    onSelect: vi.fn(), onPlacementComplete: vi.fn(), onPlacementError: vi.fn(), onCancelPlacement: vi.fn(),
  };
  const controller = new SceneEditController(store, options);
  cleanups.push(controller.connect(), controller.dispose);
  controller.pointerMove({ pointerId: 1, clientX: 10, clientY: 10 }, { point, entityId: null });
  store.getState().dispatch({ type: "PROJECT_ITEM_ADDED", payload: { productId } });
  return { store, options, controller };
}

describe("connected scene placement revision guard", () => {
  it.each(["center", "point"] as const)("does not execute an invalidated %s placement before React clears options", (method) => {
    const { store, options, controller } = setup();
    const afterExternalChange = store.getState();
    expect(controller.getSnapshot().command).toBeNull();
    expect(options.onCancelPlacement).toHaveBeenCalledOnce();
    if (method === "center") controller.placeCenter();
    else controller.placePoint(point);
    expect(store.getState()).toBe(afterExternalChange);
    expect(store.getState().project.placements).toEqual([]);
    expect(options.onPlacementComplete).not.toHaveBeenCalled();
  });

  it("does not rearm stale placement options on a selection-only configure", () => {
    const { store, options, controller } = setup();
    const afterExternalChange = store.getState();
    controller.configure({ ...options, selectedId: "project-item_selection" });
    controller.placeCenter();
    expect(store.getState()).toBe(afterExternalChange);
    expect(options.onPlacementComplete).not.toHaveBeenCalled();
  });

  it("rearms after the placement intent is cleared and explicitly chosen again", () => {
    const { store, options, controller } = setup();
    const afterExternalChange = store.getState().project;
    controller.configure({ ...options, activeProductId: null });
    controller.configure(options);
    controller.placeCenter();
    expect(store.getState().project.projectItems).toEqual(afterExternalChange.projectItems);
    expect(store.getState().project.placements).toHaveLength(1);
    expect(options.onPlacementComplete).toHaveBeenCalledOnce();
    store.getState().undo();
    expect(store.getState().project).toEqual(afterExternalChange);
  });

  it("keeps catalog drop as a fresh explicit action with its own undo step", () => {
    const { store, controller, options } = setup();
    const afterExternalChange = store.getState().project;
    controller.dropProduct(productId, point);
    expect(store.getState().project.projectItems).toEqual(afterExternalChange.projectItems);
    expect(store.getState().project.placements).toHaveLength(1);
    expect(options.onPlacementComplete).toHaveBeenCalledOnce();
    store.getState().undo();
    expect(store.getState().project).toEqual(afterExternalChange);
    expect(store.getState().canUndo).toBe(true);
  });
});
