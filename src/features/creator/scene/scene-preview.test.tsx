// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode, useEffect, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultProject } from "@/features/project/defaults";
import type { GymProject } from "@/features/project/schemas/project";
import type { PlacementTool } from "../editor-types";
import { createProjectStore, type ProjectStore } from "../store/project-store";
import type { SceneProjectPointer } from "./scene-editor-types";
import { ScenePreview } from "./scene-preview";

const scene = vi.hoisted(() => ({
  entityId: "obstacle_box" as string | null,
  canvas: null as HTMLCanvasElement | null,
  recover: false,
  fail: false,
  camera: {} as { placing: boolean; gestureActive: boolean; preset: { kind: string; sequence: number } },
}));

vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children, fallback }: { children: ReactNode; fallback: ReactNode }) => {
    if (scene.fail) throw new Error("Canvas rendering failed");
    return scene.recover ? fallback : <>{children}</>;
  },
  useThree: (selector: (state: { gl: { domElement: HTMLCanvasElement | null } }) => unknown) => selector({ gl: { domElement: scene.canvas } }),
}));
vi.mock("@react-three/drei", () => ({ useGLTF: { preload: vi.fn() } }));
vi.mock("./scene-contents", () => ({ SceneContents: () => <div data-testid="scene-renderer" /> }));
vi.mock("./scene-camera-controls", () => ({ SceneCameraControls: (props: typeof scene.camera) => { scene.camera = props; return null; } }));
vi.mock("./scene-ghost", () => ({ SceneGhost: () => null, SceneWallTargets: () => null }));
vi.mock("./scene-picking", () => ({
  ScenePicking: ({ projectPointerRef }: { projectPointerRef: RefObject<SceneProjectPointer | null> }) => {
    useEffect(() => {
      projectPointerRef.current = ({ clientX, clientY }) => ({ point: { xCm: clientX, zCm: clientY }, entityId: scene.entityId });
      return () => { projectPointerRef.current = null; };
    }, [projectPointerRef]);
    return null;
  },
}));

class TestPointerEvent extends MouseEvent {
  readonly pointerId: number;
  constructor(type: string, options: PointerEventInit = {}) {
    super(type, options);
    this.pointerId = options.pointerId ?? 1;
  }
}
class TestDragEvent extends MouseEvent {
  readonly dataTransfer: DataTransfer | null;
  constructor(type: string, options: DragEventInit = {}) {
    super(type, options);
    this.dataTransfer = options.dataTransfer ?? null;
  }
}
beforeEach(() => {
  vi.stubGlobal("PointerEvent", TestPointerEvent);
  vi.stubGlobal("DragEvent", TestDragEvent);
  scene.entityId = "obstacle_box";
  scene.canvas = document.createElement("canvas");
  scene.recover = false;
  scene.fail = false;
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function fixture(): GymProject {
  return { ...createDefaultProject(), obstacles: [{
    id: "obstacle_box", name: "Box", kind: "obstacle", rotation: 0, locked: false,
    position: { xCm: 100, zCm: 80 }, dimensions: { widthCm: 80, depthCm: 50, heightCm: 100 },
  }] };
}

function Host({ store, onFallback, initialTool = null }: {
  store: ProjectStore; onFallback: () => void; initialTool?: PlacementTool | null;
}) {
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  const [tool, setTool] = useState<PlacementTool | null>(initialTool);
  const [productId, setProductId] = useState<string | null>(null);
  const [selection, setSelection] = useState<string | null>(null);
  const [error, setError] = useState("");
  const cancel = () => { setTool(null); setProductId(null); };
  return <>
    <button onClick={() => { cancel(); setTool("obstacle"); }}>Choose obstacle</button>
    <button onClick={() => { cancel(); setProductId("product_missing"); }}>Choose missing product</button>
    <label htmlFor="exact-field">Exact position</label><input id="exact-field" />
    <p data-testid="selected-id">{selection}</p>
    <ScenePreview project={state.project} store={store} selectedId={selection} issues={[]}
      activeTool={tool} activeProductId={productId} activeProjectItemId={null} placementError={error}
      onSelect={setSelection} onCancelPlacement={cancel} onPlacementError={setError} onFallback={onFallback}
      onPlacementComplete={(id) => { setSelection(id); cancel(); }} />
  </>;
}

function mount(options: { strict?: boolean; tool?: PlacementTool | null; empty?: boolean } = {}) {
  const store = createProjectStore(options.empty ? createDefaultProject() : fixture());
  const onFallback = vi.fn();
  const host = <Host store={store} onFallback={onFallback} initialTool={options.tool} />;
  const rendered = render(options.strict ? <StrictMode>{host}</StrictMode> : host);
  const target = screen.getByRole("group", { name: "Editable 3D room" });
  const captures = new Set<number>();
  const capture = vi.fn((id: number) => { captures.add(id); });
  const release = vi.fn((id: number) => { captures.delete(id); });
  Object.defineProperties(target, {
    setPointerCapture: { value: capture },
    hasPointerCapture: { value: (id: number) => captures.has(id) },
    releasePointerCapture: { value: release },
    getBoundingClientRect: { value: () => ({ left: 0, top: 0, right: 500, bottom: 400, width: 500, height: 400 }) },
  });
  return { ...rendered, target, capture, release, store, onFallback };
}
const down = (target: Element, pointerId = 1) => fireEvent.pointerDown(target, { pointerId, button: 0, clientX: 140, clientY: 110 });
const move = (target: Element) => fireEvent.pointerMove(target, { pointerId: 1, clientX: 190, clientY: 130 });
const up = (target: Element, pointerId = 1) => fireEvent.pointerUp(target, { pointerId, button: 0, clientX: 190, clientY: 130 });
const select = (target: Element) => {
  down(target);
  fireEvent.pointerUp(target, { pointerId: 1, clientX: 140, clientY: 110 });
  expect(screen.getByTestId("selected-id").textContent).toBe("obstacle_box");
};

describe("scene DOM event integration", () => {
  it("focuses the editing surface, selects IDs, and commits a captured drag once", () => {
    const { target, store, capture, release } = mount();
    const focus = vi.spyOn(target, "focus");
    select(target);
    expect(capture).not.toHaveBeenCalled();
    expect(store.getState().revision).toBe(0);
    down(target);
    expect(document.activeElement).toBe(target);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(capture).toHaveBeenCalledWith(1);
    expect(scene.camera.gestureActive).toBe(true);
    move(target);
    expect(screen.getByText("Preview only — not yet saved or validated.")).toBeTruthy();
    expect(store.getState().revision).toBe(0);
    up(target);
    expect(store.getState().project.obstacles[0].position).toEqual({ xCm: 150, zCm: 100 });
    expect(store.getState().revision).toBe(1);
    expect(scene.camera.gestureActive).toBe(false);
    expect(release).toHaveBeenCalledOnce();
    expect(screen.getByRole("status").textContent).toContain("Change saved");
  });

  it.each(["global release", "global cancel", "blur", "Escape", "lost capture", "outside release", "second pointer", "second pointer outside", "unmount"])(
    "cancels on %s without a stale commit and restores camera control", (reason) => {
      const { target, store, release, unmount } = mount({ strict: true });
      select(target);
      down(target);
      move(target);
      switch (reason) {
        case "global release": fireEvent.pointerUp(window, { pointerId: 1 }); break;
        case "global cancel": fireEvent.pointerCancel(window, { pointerId: 1 }); break;
        case "blur": fireEvent.blur(window); break;
        case "Escape": fireEvent.keyDown(window, { key: "Escape" }); break;
        case "lost capture": fireEvent.lostPointerCapture(target, { pointerId: 1 }); break;
        case "outside release": fireEvent.pointerUp(target, { pointerId: 1, clientX: 700, clientY: 500 }); break;
        case "second pointer": down(target, 2); break;
        case "second pointer outside": down(document.body, 2); break;
        case "unmount": unmount(); break;
      }
      up(target);
      expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
      expect(release).toHaveBeenCalledOnce();
      if (reason !== "unmount") {
        expect(scene.camera.gestureActive).toBe(false);
        expect(screen.queryByText("Preview only — not yet saved or validated.")).toBeNull();
      }
    },
  );

  it("uses contextual ownership without mode buttons and releases camera after creation", () => {
    const { target, capture, store } = mount({ empty: true });
    expect(screen.queryByRole("button", { name: "Navigate" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
    expect(scene.camera.placing).toBe(false);
    down(target); move(target); up(target);
    expect(capture).not.toHaveBeenCalled();
    expect(store.getState().revision).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Choose obstacle" }));
    expect(scene.camera.placing).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Place at centre" }));
    expect(store.getState().project.obstacles).toHaveLength(1);
    expect(scene.camera.placing).toBe(false);
    expect(scene.camera.gestureActive).toBe(false);
  });

  it("passes navigation to a native canvas listener but blocks it for a selected entity and placement", () => {
    const { store, capture } = mount();
    const canvas = screen.getByTestId("scene-renderer");
    const cameraPointerDown = vi.fn();
    canvas.addEventListener("pointerdown", cameraPointerDown);
    down(canvas); move(canvas); up(canvas);
    expect(cameraPointerDown).toHaveBeenCalledOnce();
    expect(capture).not.toHaveBeenCalled();
    expect(screen.getByTestId("selected-id").textContent).toBe("");
    expect(store.getState().revision).toBe(0);
    select(canvas);
    expect(cameraPointerDown).toHaveBeenCalledTimes(2);
    down(canvas); move(canvas); up(canvas);
    expect(cameraPointerDown).toHaveBeenCalledTimes(2);
    expect(capture).toHaveBeenCalledOnce();
    expect(store.getState().revision).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: "Choose obstacle" }));
    down(canvas);
    expect(cameraPointerDown).toHaveBeenCalledTimes(2);
    expect(capture).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(window, { key: "Escape" });
    canvas.removeEventListener("pointerdown", cameraPointerDown);
  });

  it("retains selection across background navigation even when the pointer crosses an entity", () => {
    const { target, store, capture } = mount();
    select(target);
    scene.entityId = null;
    down(target);
    scene.entityId = "obstacle_box";
    move(target); up(target);
    expect(screen.getByTestId("selected-id").textContent).toBe("obstacle_box");
    expect(capture).not.toHaveBeenCalled();
    expect(store.getState().revision).toBe(0);
  });

  it.each(["canvas", "outside"])("second touch on %s cancels an unselected click before it can select", (where) => {
    const { target, store, capture } = mount();
    down(target);
    down(where === "canvas" ? target : document.body, 2);
    fireEvent.pointerUp(target, { pointerId: 1, clientX: 140, clientY: 110 });
    fireEvent.pointerUp(document.body, { pointerId: 2 });
    expect(screen.getByTestId("selected-id").textContent).toBe("");
    expect(capture).not.toHaveBeenCalled();
    expect(store.getState().revision).toBe(0);
  });

  it("keyboard placement is single-shot and Escape does not hijack inspector input", () => {
    const { target, store } = mount({ empty: true, tool: "obstacle" });
    fireEvent.keyDown(screen.getByLabelText("Exact position"), { key: "Escape" });
    expect(screen.getByRole("button", { name: "Place at centre" })).toBeTruthy();
    fireEvent.keyDown(target, { key: "Enter", repeat: true });
    expect(store.getState().revision).toBe(0);
    fireEvent.keyDown(target, { key: "Enter" });
    expect(store.getState().revision).toBe(1);
    expect(store.getState().project.obstacles).toHaveLength(1);
    expect(screen.getByRole("status").textContent).toContain("Change saved");
    fireEvent.click(screen.getByRole("button", { name: "Choose obstacle" }));
    fireEvent.keyDown(target, { key: "Escape" });
    expect(screen.queryByRole("button", { name: "Place at centre" })).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("cancelled");
    expect(store.getState().revision).toBe(1);
  });

  it("keeps creation failures visible while the pointer continues moving", () => {
    const { target, store } = mount({ empty: true });
    fireEvent.click(screen.getByRole("button", { name: "Choose missing product" }));
    fireEvent.click(screen.getByRole("button", { name: "Place at centre" }));
    expect(screen.getByRole("alert").textContent).toBe("This catalog product is unavailable.");
    move(target);
    expect(screen.getByRole("alert").textContent).toBe("This catalog product is unavailable.");
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
  });

  it("drops the existing catalog payload using the shared store without a mode toggle", () => {
    const { target, store } = mount({ empty: true });
    const dataTransfer = { types: ["application/x-home-gym-product-id"], getData: () => "product_northstar_half_rack", dropEffect: "none" };
    fireEvent.drop(target, { dataTransfer, clientX: -100, clientY: -100 });
    expect(store.getState().revision).toBe(0);
    fireEvent.dragOver(target, { dataTransfer, clientX: 200, clientY: 160 });
    expect(dataTransfer.dropEffect).toBe("copy");
    fireEvent.drop(target, { dataTransfer, clientX: 200, clientY: 160 });
    expect(store.getState().revision).toBe(1);
    expect(store.getState().project.projectItems).toHaveLength(1);
    expect(store.getState().project.placements).toHaveLength(1);
  });

  it("cancels a captured draft on an external store revision in Strict Mode", () => {
    const { target, store, release } = mount({ strict: true });
    select(target);
    down(target); move(target);
    act(() => { store.getState().dispatch({ type: "OBSTACLE_REMOVED", payload: { obstacleId: "obstacle_box" } }); });
    expect(release).toHaveBeenCalledOnce();
    expect(scene.camera.gestureActive).toBe(false);
    up(target);
    expect(store.getState().project.obstacles).toHaveLength(0);
    expect(store.getState().revision).toBe(1);
  });

  it("resets or changes the camera preset without changing the project", () => {
    const { target, store, release } = mount();
    select(target);
    down(target); move(target);
    fireEvent.click(screen.getByRole("button", { name: "Top view" }));
    expect(release).toHaveBeenCalledOnce();
    expect(scene.camera).toMatchObject({ gestureActive: false, preset: { kind: "top", sequence: 1 } });
    fireEvent.click(screen.getByRole("button", { name: "Reset view" }));
    expect(scene.camera.preset).toEqual({ kind: "fit", sequence: 2 });
    expect(store.getState().revision).toBe(0);
  });

  it("context loss releases capture and its recovery button is not swallowed by scene capture", () => {
    const { target, store, capture, release, onFallback } = mount({ strict: true });
    select(target);
    down(target); move(target);
    const loss = new Event("webglcontextlost", { cancelable: true });
    act(() => { scene.canvas!.dispatchEvent(loss); });
    expect(loss.defaultPrevented).toBe(true);
    expect(release).toHaveBeenCalledOnce();
    const fallback = screen.getByRole("button", { name: "Continue in 2D" });
    down(fallback);
    fireEvent.pointerUp(fallback, { pointerId: 1, clientX: 140, clientY: 110 });
    fireEvent.click(fallback);
    expect(capture).toHaveBeenCalledOnce();
    expect(onFallback).toHaveBeenCalledOnce();
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
  });

  it("unavailable Canvas keeps controls and fallback reachable without capture", () => {
    scene.recover = true;
    const { capture, onFallback } = mount();
    const fallback = screen.getByRole("button", { name: "Continue in 2D" });
    down(fallback);
    fireEvent.click(fallback);
    expect(onFallback).toHaveBeenCalledOnce();
    expect(capture).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Reset view" })).toBeTruthy();
  });

  it("whole-Canvas rendering failure releases an active capture and keeps recovery clickable", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { target, store, release, onFallback } = mount();
    select(target);
    down(target);
    scene.fail = true;
    move(target);
    expect(release).toHaveBeenCalledOnce();
    expect(screen.queryByText("Preview only — not yet saved or validated.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue in 2D" }));
    expect(onFallback).toHaveBeenCalledOnce();
    expect(store.getState()).toMatchObject({ revision: 0, canUndo: false });
  });

  it("removes every global listener after Strict Mode replay and final unmount", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = mount({ strict: true });
    unmount();
    for (const name of ["blur", "keydown", "pointerup", "pointercancel", "pointerdown"]) {
      const installed = add.mock.calls.filter(([type]) => type === name).map(([, listener]) => listener);
      const removed = remove.mock.calls.filter(([type]) => type === name).map(([, listener]) => listener);
      expect(installed.length).toBeGreaterThan(0);
      expect(removed).toEqual(installed);
    }
  });
});
