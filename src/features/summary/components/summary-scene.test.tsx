// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { createDemoProject } from "@/features/project/demo-project";
import { SummaryScene } from "./summary-scene";

const scene = vi.hoisted(() => ({ mode: "normal", canvas: null as HTMLCanvasElement | null, contents: vi.fn(), controls: vi.fn() }));
vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children, fallback }: { children: ReactNode; fallback: ReactNode }) => {
    if (scene.mode === "error") throw new Error("No graphics");
    // R3F mounts fallback as canvas child content even in supported browsers.
    return <div data-testid="canvas"><canvas>{fallback}</canvas>{scene.mode === "unsupported" ? null : children}</div>;
  },
  useThree: (select: (state: { gl: { domElement: HTMLCanvasElement | null } }) => unknown) => select({ gl: { domElement: scene.canvas } }),
}));
vi.mock("@/features/creator/scene/scene-contents", () => ({ SceneContents: (props: unknown) => { scene.contents(props); return null; } }));
vi.mock("@/features/creator/scene/scene-camera-controls", () => ({ SceneCameraControls: (props: unknown) => { scene.controls(props); return null; } }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); scene.mode = "normal"; });

it("composes only read-only scene visuals and camera controls without a store", () => {
  scene.canvas = document.createElement("canvas");
  const project = createDemoProject();
  const original = JSON.stringify(project);
  const fallback = vi.fn();
  render(<SummaryScene project={project} issues={[]} onFallback={fallback} />);
  const view = screen.getByRole("group", { name: "Read-only 3D room layout" });
  fireEvent.pointerDown(view, { clientX: 10 });
  fireEvent.pointerMove(view, { clientX: 50 });
  fireEvent.pointerUp(view);
  expect(JSON.stringify(project)).toBe(original);
  expect(scene.contents).toHaveBeenCalledWith({ project, issues: [], selectedId: null });
  expect(scene.controls).toHaveBeenCalledWith(expect.objectContaining({ placing: false, gestureActive: false }));
  expect(fallback).not.toHaveBeenCalled();
});

it("automatically falls back on a graphics error", () => {
  scene.mode = "error";
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const fallback = vi.fn();
  render(<SummaryScene project={createDemoProject()} issues={[]} onFallback={fallback} />);
  expect(fallback).toHaveBeenCalledOnce();
});

it("provides recovery for a browser without canvas support", () => {
  scene.mode = "unsupported";
  const fallback = vi.fn();
  render(<SummaryScene project={createDemoProject()} issues={[]} onFallback={fallback} />);
  fireEvent.click(screen.getByRole("button", { name: "Continue in 2D" }));
  expect(fallback).toHaveBeenCalledOnce();
});

it("falls back on context loss and removes its listener on unmount", () => {
  scene.canvas = document.createElement("canvas");
  const fallback = vi.fn();
  const { unmount } = render(<SummaryScene project={createDemoProject()} issues={[]} onFallback={fallback} />);
  fireEvent(scene.canvas, new Event("webglcontextlost", { cancelable: true }));
  expect(fallback).toHaveBeenCalledOnce();
  unmount();
  fireEvent(scene.canvas, new Event("webglcontextlost", { cancelable: true }));
  expect(fallback).toHaveBeenCalledOnce();
});
