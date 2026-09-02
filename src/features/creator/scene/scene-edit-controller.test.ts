import { afterEach, describe, expect, it, vi } from "vitest";
import { catalogProducts } from "@/data/products";
import { snapWallMountedPlacement } from "@/features/geometry/wall-mounting";
import { createDefaultProject } from "@/features/project/defaults";
import type { GymProject } from "@/features/project/schemas/project";
import { createRoomWebMcpTools } from "@/features/webmcp/register-room-tools";
import { createProjectStore } from "../store/project-store";
import { SceneEditController, type SceneControllerOptions } from "./scene-edit-controller";

const cleanups: (() => void)[] = [];
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()));

function setup(overrides: Partial<SceneControllerOptions> = {}, project = createDefaultProject()) {
  const store = createProjectStore(project);
  const options: SceneControllerOptions = {
    selectedId: null, activeTool: null, activeProductId: null, activeProjectItemId: null,
    onSelect: vi.fn(), onPlacementComplete: vi.fn(), onPlacementError: vi.fn(), onCancelPlacement: vi.fn(),
    ...overrides,
  };
  const controller = new SceneEditController(store, options);
  cleanups.push(controller.connect(), controller.dispose);
  const release = vi.fn();
  const capture = vi.fn(() => release);
  return { controller, store, options, release, capture };
}
const pointer = (clientX = 10, clientY = 10, pointerId = 1) => ({ clientX, clientY, pointerId });
const hit = (xCm = 140, zCm = 110, entityId: string | null = "obstacle_box") => ({ point: { xCm, zCm }, entityId });
function withObstacle(locked = false): GymProject {
  return { ...createDefaultProject(), obstacles: [{
    id: "obstacle_box", name: "Box", kind: "obstacle", locked, rotation: 0,
    position: { xCm: 103, zCm: 87 }, dimensions: { widthCm: 80, depthCm: 50, heightCm: 100 },
    functionalClearance: { frontCm: 0, backCm: 0, leftCm: 0, rightCm: 0 },
  }] };
}
function startDrag(context: ReturnType<typeof setup>) {
  context.controller.pointerDown(pointer(), hit(), context.capture);
  context.controller.pointerMove(pointer(40), hit(190, 130));
}

describe("scene controller creation against the shared store", () => {
  it.each(["click", "center", "drop"] as const)("reuses the first unplaced catalog purchase through %s with one undo", (method) => {
    const productId = "product_northstar_half_rack";
    const project = { ...createDefaultProject(), projectItems: [
      { id: "project-item_first", productId }, { id: "project-item_second", productId },
    ] };
    const { controller, store, capture } = setup({ activeProductId: productId }, project);
    controller.pointerMove(pointer(), hit(200, 160, null));
    expect(controller.getSnapshot().command).toMatchObject({ type: "PROJECT_ITEM_PLACED", payload: { projectItemId: "project-item_first" } });
    expect(store.getState().project).toEqual(project);
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
    if (method === "click") {
      controller.pointerDown(pointer(), hit(200, 160, null), capture);
      controller.pointerUp(pointer(), hit(200, 160, null), true);
    } else if (method === "center") controller.placeCenter();
    else controller.dropProduct(productId, { xCm: 200, zCm: 160 });
    expect(store.getState().project.projectItems).toEqual(project.projectItems);
    expect(store.getState().project.placements).toMatchObject([{ projectItemId: "project-item_first" }]);
    expect(store.getState().revision).toBe(1);
    store.getState().undo();
    expect(store.getState().project).toEqual(project);
    expect(store.getState().canUndo).toBe(false);
  });

  it("uses the current purchase list for a drop after another actor places the first item", () => {
    const productId = "product_northstar_half_rack";
    const project = { ...createDefaultProject(), projectItems: [
      { id: "project-item_first", productId }, { id: "project-item_second", productId },
    ] };
    const { controller, store } = setup({}, project);
    store.getState().dispatch({ type: "PROJECT_ITEM_PLACED", payload: {
      projectItemId: "project-item_first", position: { xCm: 0, zCm: 0 }, rotation: 0,
    } });
    controller.dropProduct(productId, { xCm: 200, zCm: 160 });
    expect(store.getState().project.projectItems).toEqual(project.projectItems);
    expect(store.getState().project.placements.map((placement) => placement.projectItemId))
      .toEqual(["project-item_first", "project-item_second"]);
    expect(store.getState().revision).toBe(2);
  });

  it("cancels an existing-purchase preview without modifying the purchase or history", () => {
    const productId = "product_northstar_half_rack";
    const project = { ...createDefaultProject(), projectItems: [{ id: "project-item_first", productId }] };
    const { controller, store, options } = setup({ activeProductId: productId }, project);
    controller.pointerMove(pointer(), hit(200, 160, null));
    controller.cancelPlacement();
    expect(controller.getSnapshot().command).toBeNull();
    expect(store.getState().project).toEqual(project);
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
    expect(options.onCancelPlacement).toHaveBeenCalledOnce();
  });

  it("refuses an outdated catalog preview even if live state now has a reusable purchase", () => {
    const productId = "product_northstar_half_rack";
    const store = createProjectStore(createDefaultProject());
    const options: SceneControllerOptions = { selectedId: null, activeTool: null,
      activeProductId: productId, activeProjectItemId: null,
      onSelect: vi.fn(), onPlacementComplete: vi.fn(), onPlacementError: vi.fn(), onCancelPlacement: vi.fn(),
    };
    // Intentionally no connect(): exercise the final revision guard before subscription cancellation.
    const controller = new SceneEditController(store, options);
    cleanups.push(controller.dispose);
    controller.pointerMove(pointer(), hit(200, 160, null));
    store.getState().dispatch({ type: "PROJECT_ITEM_ADDED", payload: { productId } });
    const current = store.getState();
    controller.placeCenter();
    expect(store.getState()).toBe(current);
    expect(store.getState().project.placements).toEqual([]);
    expect(options.onPlacementComplete).not.toHaveBeenCalled();
    expect(controller.getSnapshot().status).toBe("Project changed; edit cancelled.");
  });

  it.each(["obstacle", "unavailable-zone", "door", "window"] as const)("previews and creates %s once with one undo step", (activeTool) => {
    const { controller, store, options, capture, release } = setup({ activeTool });
    const target = hit(200, activeTool === "door" || activeTool === "window" ? 0 : 160, null);
    controller.pointerMove(pointer(), target);
    const preview = controller.getSnapshot().command;
    expect(preview).not.toBeNull();
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
    expect(controller.pointerDown(pointer(), target, capture)).toBe(true);
    expect(store.getState().revision).toBe(0);
    controller.pointerUp(pointer(), target, true);
    controller.pointerUp(pointer(), target, true);
    expect(store.getState().revision).toBe(1);
    expect(options.onPlacementComplete).toHaveBeenCalledTimes(1);
    const entity = [...store.getState().project.obstacles, ...store.getState().project.wallElements][0];
    expect(entity).toMatchObject(preview!.payload);
    expect(options.onPlacementComplete).toHaveBeenCalledWith(entity.id);
    expect(release).toHaveBeenCalledOnce();
    expect(store.getState().undo()).toBe(true);
    expect(store.getState().project).toEqual(createDefaultProject());
    expect(store.getState().canUndo).toBe(false);
  });

  it.each(catalogProducts.filter((product) => product.placementMode !== "selection-only").map((product) => product.id))(
    "places catalog product %s through the real command without duplicate items", (activeProductId) => {
      const { controller, store, options } = setup({ activeProductId }, {
        ...createDefaultProject(), room: { widthCm: 1500, depthCm: 1200, heightCm: 400 },
      });
      controller.placeCenter();
      expect(options.onPlacementError).toHaveBeenLastCalledWith("");
      expect(store.getState()).toMatchObject({ revision: 1, project: {
        projectItems: [{ productId: activeProductId }], placements: [{ projectItemId: expect.any(String) }],
      } });
      expect(store.getState().project.projectItems).toHaveLength(1);
      expect(store.getState().project.placements).toHaveLength(1);
      store.getState().undo();
      expect(store.getState().project.projectItems).toEqual([]);
      expect(store.getState().project.placements).toEqual([]);
      expect(store.getState().canUndo).toBe(false);
    },
  );

  it("places an existing unplaced item and rejects a second placement without changing history", () => {
    const project = { ...createDefaultProject(), projectItems: [{ id: "project-item_bench", productId: "product_northstar_half_rack" }] };
    const { controller, store, options } = setup({ activeProjectItemId: "project-item_bench" }, project);
    controller.placeCenter();
    expect(store.getState().project.projectItems).toEqual(project.projectItems);
    expect(store.getState().project.placements).toHaveLength(1);
    controller.placeCenter();
    expect(options.onPlacementError).toHaveBeenLastCalledWith("This project item is already placed.");
    expect(store.getState().revision).toBe(1);
    store.getState().undo();
    expect(store.getState().project).toEqual(project);
  });

  it.each([
    { activeProductId: "product_missing" }, { activeProjectItemId: "project-item_missing" },
    ...catalogProducts.filter((product) => product.placementMode === "selection-only").map((product) => ({ activeProductId: product.id })),
  ])("rejects unavailable or selection-only choices: %o", (choice) => {
    const { controller, store, options } = setup(choice);
    controller.placeCenter();
    expect(options.onPlacementError).toHaveBeenCalledWith(expect.any(String));
    expect(options.onPlacementComplete).not.toHaveBeenCalled();
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
  });

  it("rejects invalid and oversized creation targets without history", () => {
    const { controller, store, options } = setup({ activeTool: "obstacle" }, {
      ...createDefaultProject(), room: { widthCm: 40, depthCm: 40, heightCm: 240 },
    });
    controller.placeCenter();
    expect(options.onPlacementError).toHaveBeenLastCalledWith("The default area does not fit in this room.");
    controller.placePoint({ xCm: -100, zCm: -100 });
    expect(options.onPlacementError).toHaveBeenLastCalledWith(expect.stringContaining("inside the room"));
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
  });

  it("supports catalog drop, rejecting an outside drop", () => {
    const { controller, store, options } = setup();
    controller.dropProduct("product_northstar_half_rack", { xCm: -100, zCm: 30 });
    expect(store.getState().revision).toBe(0);
    expect(options.onPlacementError).toHaveBeenLastCalledWith("Drop equipment inside the room boundary.");
    controller.dropProduct("product_northstar_half_rack", { xCm: 200, zCm: 160 });
    expect(store.getState().revision).toBe(1);
    expect(store.getState().project.placements).toHaveLength(1);
  });

  it("never creates on drag and incorporates coalesced release movement", () => {
    const { controller, store, capture } = setup({ activeTool: "obstacle" });
    controller.pointerDown(pointer(), hit(200, 160, null), capture);
    controller.pointerUp(pointer(70), hit(260, 160, null), true);
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
  });
});

describe("scene controller gesture ownership and history", () => {
  it.each(["obstacle_box", null])("selects or clears %s on a click even when its ray misses the floor", (entityId) => {
    const { controller, store, capture, options } = setup({}, withObstacle());
    const projection = { point: null, entityId };
    controller.pointerDown(pointer(), projection, capture);
    controller.pointerUp(pointer(), projection, true);
    expect(options.onSelect).toHaveBeenLastCalledWith(entityId);
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
  });

  it.each(["start", "end", "both"])("does not drag when the %s floor projection is missing", (missing) => {
    const { controller, store, capture } = setup({ selectedId: "obstacle_box" }, withObstacle());
    const absent = { point: null, entityId: "obstacle_box" };
    controller.pointerDown(pointer(), missing === "end" ? hit() : absent, capture);
    controller.pointerUp(pointer(80), missing === "start" ? hit(220, 180) : absent, true);
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
  });

  it("clears a placement ghost when the floor projection disappears and never creates there", () => {
    const { controller, store, capture, options } = setup({ activeTool: "obstacle" });
    controller.pointerMove(pointer(), hit());
    expect(controller.getSnapshot().command).not.toBeNull();
    const projection = { point: null, entityId: null };
    controller.pointerMove(pointer(40), projection);
    expect(controller.getSnapshot().command).toBeNull();
    controller.pointerDown(pointer(), projection, capture);
    controller.pointerUp(pointer(), projection, true);
    expect(options.onPlacementComplete).not.toHaveBeenCalled();
    expect(options.onPlacementError).toHaveBeenLastCalledWith(expect.stringContaining("Choose a target"));
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
  });

  it("selects click IDs and clears empty selection without mutating", () => {
    const { controller, store, capture, options } = setup({}, withObstacle());
    for (const entityId of ["obstacle_box", null]) {
      const target = hit(140, 110, entityId);
      controller.pointerDown(pointer(), target, capture);
      controller.pointerUp(pointer(12), target, true);
      expect(options.onSelect).toHaveBeenLastCalledWith(entityId);
    }
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
  });

  it("preserves grab offset/off-grid position and commits many pointer moves once", () => {
    const context = setup({ selectedId: "obstacle_box" }, withObstacle());
    startDrag(context);
    for (let step = 1; step <= 15; step++) context.controller.pointerMove(pointer(40 + step), hit(190 + step, 130));
    expect(context.store.getState().revision).toBe(0);
    expect(context.controller.getSnapshot().command).toMatchObject({ payload: { patch: { position: { xCm: 173, zCm: 107 } } } });
    context.controller.pointerUp(pointer(55), hit(205, 130), true);
    context.controller.pointerUp(pointer(55), hit(205, 130), true);
    expect(context.store.getState().revision).toBe(1);
    expect(context.store.getState().project.obstacles[0].position).toEqual({ xCm: 173, zCm: 107 });
    expect(context.release).toHaveBeenCalledOnce();
    context.store.getState().undo();
    expect(context.store.getState().project).toEqual(withObstacle());
    expect(context.store.getState().canUndo).toBe(false);
  });

  it.each([false, true])("does not commit snapped no-op or locked movement (locked=%s)", (locked) => {
    const { controller, store, capture, options } = setup({ selectedId: "obstacle_box" }, withObstacle(locked));
    controller.pointerDown(pointer(), hit(), capture);
    controller.pointerUp(pointer(50), hit(locked ? 250 : 142, 110), true);
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
    if (locked) expect(options.onPlacementError).toHaveBeenCalledWith(expect.stringContaining("locked"));
  });

  it("moves unavailable zones through the same command and history as physical obstacles", () => {
    const project: GymProject = { ...createDefaultProject(), obstacles: [{
      id: "obstacle_box", name: "Zone", kind: "unavailable-zone", locked: false, rotation: 0,
      position: { xCm: 103, zCm: 87 }, dimensions: { widthCm: 80, depthCm: 50 },
    }] };
    const context = setup({ selectedId: "obstacle_box" }, project);
    startDrag(context);
    context.controller.pointerUp(pointer(40), hit(190, 130), true);
    expect(context.store.getState().project.obstacles[0]).toMatchObject({
      kind: "unavailable-zone", position: { xCm: 153, zCm: 107 }, dimensions: { widthCm: 80, depthCm: 50 },
    });
    expect(context.store.getState().revision).toBe(1);
    context.store.getState().undo();
    expect(context.store.getState().project).toEqual(project);
  });

  it.each(["top", "right", "bottom", "left"] as const)("retains %s wall and clamps opening movement to its length", (wall) => {
    const project: GymProject = { ...createDefaultProject(), wallElements: [{
      id: "wall-element_opening", name: "Door", kind: "door", wall, offsetCm: 65, widthCm: 90,
    }] };
    const { controller, store, capture } = setup({ selectedId: "wall-element_opening" }, project);
    controller.pointerDown(pointer(), hit(100, 100, "wall-element_opening"), capture);
    controller.pointerUp(pointer(80), hit(800, 800), true);
    const length = wall === "top" || wall === "bottom" ? project.room.widthCm : project.room.depthCm;
    expect(store.getState().project.wallElements[0]).toEqual({ ...project.wallElements[0], offsetCm: length - 90 });
    expect(store.getState().revision).toBe(1);
  });

  it.each([
    { xCm: 200, zCm: 0 }, { xCm: 400, zCm: 160 }, { xCm: 200, zCm: 320 }, { xCm: 0, zCm: 160 },
  ])("projects mounted equipment onto its retained wall for diagonal pointer movement: %o", (target) => {
    const product = catalogProducts.find((product) => product.mounting?.kind === "wall")!;
    const project = createDefaultProject();
    const pose = snapWallMountedPlacement(target, product.dimensions, project.room)!;
    const placed: GymProject = { ...project,
      projectItems: [{ id: "project-item_mounted", productId: product.id }],
      placements: [{ locked: false, id: "placement_mounted", projectItemId: "project-item_mounted", ...pose }],
    };
    const { controller, store, capture } = setup({ selectedId: "placement_mounted" }, placed);
    controller.pointerDown(pointer(), hit(target.xCm, target.zCm, "placement_mounted"), capture);
    controller.pointerUp(pointer(80), hit(target.xCm + 47, target.zCm + 37), true);
    const actual = store.getState().project.placements[0];
    expect(actual.rotation).toBe(pose.rotation);
    if (pose.rotation === 0 || pose.rotation === 180) {
      expect(actual.position).toEqual({ xCm: pose.position.xCm + 50, zCm: pose.position.zCm });
    } else {
      expect(actual.position).toEqual({ xCm: pose.position.xCm, zCm: pose.position.zCm + 40 });
    }
    expect(store.getState().revision).toBe(1);
    store.getState().undo();
    expect(store.getState().project).toEqual(placed);
  });

  it.each([null, "obstacle_box"])("dragging unselected target %s navigates without capture, preview, selection or mutation", (entityId) => {
    const { controller, store, capture, options } = setup({}, withObstacle());
    expect(controller.pointerDown(pointer(), hit(140, 110, entityId), capture)).toBe(false);
    controller.pointerMove(pointer(50), hit(200, 200));
    controller.pointerUp(pointer(50), hit(200, 200), true);
    expect(controller.getSnapshot()).toMatchObject({ command: null, gestureActive: false });
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
    expect(capture).not.toHaveBeenCalled();
    expect(options.onSelect).not.toHaveBeenCalled();
  });

  it("selects on the first click, then edits only the next drag on that selected entity", () => {
    const { controller, store, capture, options } = setup({}, withObstacle());
    expect(controller.pointerDown(pointer(), hit(), capture)).toBe(false);
    controller.pointerUp(pointer(), hit(), true);
    expect(options.onSelect).toHaveBeenLastCalledWith("obstacle_box");
    expect(capture).not.toHaveBeenCalled();
    controller.configure({ ...options, selectedId: "obstacle_box" });
    expect(controller.pointerDown(pointer(), hit(), capture)).toBe(true);
    expect(controller.getSnapshot().gestureActive).toBe(true);
    controller.pointerUp(pointer(40), hit(190, 130), true);
    expect(store.getState().project.obstacles[0].position).toEqual({ xCm: 153, zCm: 107 });
    expect(store.getState().revision).toBe(1);
  });

  it("fixes ownership at pointerdown across background, selected and other entity hits", () => {
    const { controller, store, capture, options } = setup({ selectedId: "obstacle_box" }, withObstacle());
    expect(controller.pointerDown(pointer(), hit(140, 110, null), capture)).toBe(false);
    controller.pointerUp(pointer(40), hit(190, 130, "obstacle_box"), true);
    expect(options.onSelect).not.toHaveBeenCalled();
    expect(store.getState().revision).toBe(0);
    expect(controller.pointerDown(pointer(), hit(), capture)).toBe(true);
    controller.pointerMove(pointer(30), hit(170, 120, "obstacle_other"));
    controller.pointerUp(pointer(40), hit(190, 130, null), true);
    expect(store.getState().project.obstacles[0].position).toEqual({ xCm: 153, zCm: 107 });
    expect(options.onSelect).toHaveBeenLastCalledWith("obstacle_box");
    expect(capture).toHaveBeenCalledOnce();
  });

  it.each([null, "obstacle_other"])("navigation over %s retains an existing selection", (entityId) => {
    const { controller, store, capture, options } = setup({ selectedId: "obstacle_box" }, withObstacle());
    expect(controller.pointerDown(pointer(), { point: null, entityId }, capture)).toBe(false);
    controller.pointerUp(pointer(60), { point: null, entityId }, true);
    expect(options.onSelect).not.toHaveBeenCalled();
    expect(capture).not.toHaveBeenCalled();
    expect(store.getState().revision).toBe(0);
  });

  it("a second pointer cancels a navigation click without selecting or clearing", () => {
    const { controller, store, capture, options } = setup({}, withObstacle());
    controller.pointerDown(pointer(), hit(), capture);
    controller.pointerDown(pointer(10, 10, 2), null, capture);
    controller.pointerUp(pointer(), hit(), true);
    controller.pointerUp(pointer(10, 10, 2), hit(), true);
    expect(options.onSelect).not.toHaveBeenCalled();
    expect(capture).not.toHaveBeenCalled();
    expect(store.getState().revision).toBe(0);
  });

  it("does not turn camera movement through a missing ray into a click when the pointer returns", () => {
    const { controller, store, capture, options } = setup({}, withObstacle());
    expect(controller.pointerDown(pointer(), hit(), capture)).toBe(false);
    controller.pointerMove(pointer(80), null);
    controller.pointerUp(pointer(), hit(), true);
    expect(options.onSelect).not.toHaveBeenCalled();
    expect(store.getState().revision).toBe(0);
    expect(capture).not.toHaveBeenCalled();
  });

  it.each(["pointercancel", "lost capture", "outside release", "missing hit", "second touch", "blur/unmount", "Escape/Cancel", "selection change", "tool switch"])(
    "cancels %s, releases capture and ignores stale pointerup", (reason) => {
      const context = setup({ selectedId: "obstacle_box" }, withObstacle());
      const { controller, store, options } = context;
      startDrag(context);
      expect(controller.getSnapshot().command).not.toBeNull();
      switch (reason) {
        case "pointercancel": controller.pointerCancel(1); break;
        case "lost capture": controller.lostCapture(1); break;
        case "outside release": controller.pointerUp(pointer(40), hit(190, 130), false); break;
        case "missing hit": controller.pointerUp(pointer(40), null, true); break;
        case "second touch": controller.pointerDown(pointer(20, 20, 2), hit(), context.capture); break;
        case "blur/unmount": controller.dispose(); break;
        case "Escape/Cancel": controller.cancelPlacement(); break;
        case "selection change": controller.configure({ ...options, selectedId: null }); break;
        case "tool switch": controller.configure({ ...options, activeTool: "door" }); break;
      }
      controller.pointerUp(pointer(40), hit(190, 130), true);
      expect(controller.getSnapshot()).toMatchObject({ command: null, gestureActive: false });
      expect(context.release).toHaveBeenCalledOnce();
      expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
    },
  );

  it("ignores a non-owning pointer's move, release and cancellation", () => {
    const context = setup({ selectedId: "obstacle_box" }, withObstacle());
    startDrag(context);
    const draft = context.controller.getSnapshot().command;
    context.controller.pointerMove(pointer(100, 100, 99), hit(300, 300));
    context.controller.pointerCancel(99);
    context.controller.pointerUp(pointer(100, 100, 99), hit(300, 300), true);
    expect(context.controller.getSnapshot().command).toEqual(draft);
    expect(context.release).not.toHaveBeenCalled();
    context.controller.pointerUp(pointer(40), hit(190, 130), true);
    expect(context.store.getState().revision).toBe(1);
  });

  it("releases lost pointer ownership before a fresh touch starts, even without the old pointerup", () => {
    const context = setup({ selectedId: "obstacle_box" }, withObstacle());
    startDrag(context);
    context.controller.lostCapture(1);
    context.controller.pointerDown(pointer(10, 10, 2), hit(), context.capture);
    context.controller.pointerUp(pointer(40, 10, 2), hit(190, 130), true);
    expect(context.store.getState().revision).toBe(1);
    expect(context.capture).toHaveBeenCalledTimes(2);
    expect(context.release).toHaveBeenCalledTimes(2);
  });

  it("allows domain-successful moves that leave validation errors, without renderer-specific rejection", () => {
    const context = setup({ selectedId: "obstacle_box" }, withObstacle());
    context.controller.pointerDown(pointer(), hit(), context.capture);
    context.controller.pointerUp(pointer(90), hit(430, 330), true);
    expect(context.store.getState().revision).toBe(1);
    expect(context.store.getState().validation.issues.some((issue) => issue.severity === "error")).toBe(true);
    expect(context.options.onPlacementError).toHaveBeenLastCalledWith("");
  });

  it("cleans pointer ownership on blur/unmount and reconnects after Strict Mode cleanup", () => {
    const context = setup({ selectedId: "obstacle_box" }, withObstacle());
    const unsubscribeSnapshot = context.controller.subscribe(vi.fn());
    startDrag(context);
    context.controller.dispose();
    unsubscribeSnapshot();
    const disconnect = context.controller.connect();
    disconnect();
    context.controller.pointerDown(pointer(10, 10, 2), hit(), context.capture);
    context.controller.pointerUp(pointer(40, 10, 2), hit(190, 130), true);
    expect(context.store.getState().revision).toBe(1);
    expect(context.capture).toHaveBeenCalledTimes(2);
    expect(context.release).toHaveBeenCalledTimes(2);
  });
});

describe("scene controller shared-editing concurrency", () => {
  it.each(["agent move", "agent remove", "unrelated edit", "resize", "undo", "redo", "replace"])(
    "invalidates a draft on %s and cannot overwrite newer state", (change) => {
      const context = setup({ selectedId: "obstacle_box" }, withObstacle());
      const { store, controller } = context;
      if (change === "undo" || change === "redo") {
        store.getState().dispatch({ type: "PROJECT_SETTINGS_UPDATED", payload: { budget: 9000 } });
        if (change === "redo") store.getState().undo();
      }
      startDrag(context);
      switch (change) {
        case "agent move": store.getState().dispatch({ type: "OBSTACLE_UPDATED", payload: { obstacleId: "obstacle_box", patch: { position: { xCm: 250, zCm: 90 } } } }); break;
        case "agent remove": store.getState().dispatch({ type: "OBSTACLE_REMOVED", payload: { obstacleId: "obstacle_box" } }); break;
        case "unrelated edit": store.getState().dispatch({ type: "PROJECT_SETTINGS_UPDATED", payload: { budget: 9000 } }); break;
        case "resize": store.getState().dispatch({ type: "ROOM_CONFIGURED", payload: { widthCm: 500, depthCm: 450, heightCm: 240 } }); break;
        case "undo": store.getState().undo(); break;
        case "redo": store.getState().redo(); break;
        case "replace": store.getState().replaceProject(createDefaultProject()); break;
      }
      const current = store.getState();
      expect(controller.getSnapshot()).toMatchObject({ command: null, gestureActive: false });
      expect(context.release).toHaveBeenCalledOnce();
      controller.pointerUp(pointer(40), hit(190, 130), true);
      expect(store.getState()).toBe(current);
    },
  );

  it("cancels a placement preview after a revision, including before the store subscription connects", () => {
    const context = setup({ activeTool: "obstacle" });
    context.controller.pointerMove(pointer(), hit());
    context.store.getState().dispatch({ type: "PROJECT_SETTINGS_UPDATED", payload: { budget: 9000 } });
    expect(context.controller.getSnapshot().command).toBeNull();
    expect(context.options.onCancelPlacement).toHaveBeenCalledOnce();
    const disconnected = new SceneEditController(context.store, context.options);
    context.store.getState().dispatch({ type: "PROJECT_SETTINGS_UPDATED", payload: { budget: 8000 } });
    disconnected.placeCenter();
    expect(context.store.getState().project.obstacles).toEqual([]);
    expect(disconnected.getSnapshot().status).toContain("Project changed");
  });

  it("manual edit → actual WebMCP read/mutation → validation → correction → shared undo", async () => {
    const context = setup({ selectedId: "obstacle_box" }, withObstacle());
    const { controller, store } = context;
    const tools = createRoomWebMcpTools(store);
    const execute = (name: string, input: object) => tools.find((tool) => tool.name === name)!.execute(input);
    startDrag(context);
    const draft = controller.getSnapshot().command;
    await execute("get_project_state", {});
    await execute("validate_layout", {});
    expect(controller.getSnapshot().command).toEqual(draft);
    expect(context.release).not.toHaveBeenCalled();
    controller.pointerUp(pointer(40), hit(190, 130), true);
    const manuallyMoved = store.getState().project;
    expect(manuallyMoved.obstacles[0].position).toEqual({ xCm: 153, zCm: 107 });
    startDrag(context);
    await execute("update_obstacle", { obstacleId: "obstacle_box", patch: { position: { xCm: 390, zCm: 300 } } });
    expect(controller.getSnapshot().command).toBeNull();
    const agentState = store.getState();
    controller.pointerUp(pointer(40), hit(190, 130), true);
    expect(store.getState()).toBe(agentState);
    expect(store.getState().validation.issues.some((issue) => issue.severity === "error")).toBe(true);
    await execute("update_obstacle", { obstacleId: "obstacle_box", patch: { position: { xCm: 200, zCm: 150 } } });
    expect(store.getState().validation.issues.some((issue) => issue.severity === "error")).toBe(false);
    store.getState().undo();
    expect(store.getState().project).toEqual(agentState.project);
    store.getState().undo();
    expect(store.getState().project).toEqual(manuallyMoved);
    store.getState().undo();
    expect(store.getState().project).toEqual(withObstacle());
    expect(store.getState().canUndo).toBe(false);
  });
});
