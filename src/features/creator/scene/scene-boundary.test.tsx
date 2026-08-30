// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode, Suspense, useEffect, useState } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { AssetBoundary } from "./scene-asset-boundary";
import { SceneBoundary, SceneContextLoss, SceneRecovery } from "./scene-boundary";

const context = vi.hoisted(() => ({ canvas: null as HTMLCanvasElement | null }));
vi.mock("@react-three/fiber", () => ({
  useThree: (select: (state: { gl: { domElement: HTMLCanvasElement | null } }) => unknown) => select({ gl: { domElement: context.canvas } }),
}));

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function FailedScene(): never { throw new Error("WebGL unavailable"); }

it("keeps outer editor state and fallback action alive after a scene failure without retry", () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  let mounts = 0;
  function Editor() {
    const [view, setView] = useState("3d");
    const [history, setHistory] = useState(1);
    return <>
      <button onClick={() => setHistory(history + 1)}>Undo {history}</button>
      <p>Shared bridge active</p>
      {view === "3d" ? <SceneBoundary onFallback={() => setView("2d")}>
        <FailedScene />
      </SceneBoundary> : <p>Same project in 2D</p>}
    </>;
  }
  function Host() { useEffect(() => { mounts += 1; }, []); return <Editor />; }
  render(<Host />);
  expect(screen.getByRole("alert").textContent).toContain("history are safe");
  fireEvent.click(screen.getByRole("button", { name: "Undo 1" }));
  expect(screen.getByRole("button", { name: "Undo 2" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Continue in 2D" }));
  expect(screen.getByText("Same project in 2D")).toBeTruthy();
  expect(screen.getByText("Shared bridge active")).toBeTruthy();
  expect(mounts).toBe(1);
});

it("does not escalate an isolated asset failure to the whole scene", () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  render(<SceneBoundary onFallback={vi.fn()}>
    <AssetBoundary fallback={<p>Equipment solid</p>}><FailedScene /></AssetBoundary>
    <p>Room remains editable</p>
  </SceneBoundary>);
  expect(screen.getByText("Equipment solid")).toBeTruthy();
  expect(screen.getByText("Room remains editable")).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
});

it("keeps DOM controls and recovery available while the scene suspends", () => {
  const pending = new Promise(() => undefined);
  function Loading(): never { throw pending; }
  const fallback = vi.fn();
  render(<><button>Inspector</button><SceneBoundary onFallback={fallback}>
    <Suspense fallback={<SceneRecovery message="Loading 3D" onFallback={fallback} />}><Loading /></Suspense>
  </SceneBoundary></>);
  expect(screen.getByRole("button", { name: "Inspector" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Continue in 2D" }));
  expect(fallback).toHaveBeenCalledOnce();
});

it("handles context loss once in Strict Mode and removes the listener on unmount", () => {
  const canvas = document.createElement("canvas");
  context.canvas = canvas;
  const lost = vi.fn();
  const { unmount } = render(<StrictMode><SceneContextLoss onContextLost={lost} /></StrictMode>);
  const event = new Event("webglcontextlost", { cancelable: true });
  canvas.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  expect(lost).toHaveBeenCalledOnce();
  unmount();
  canvas.dispatchEvent(new Event("webglcontextlost"));
  expect(lost).toHaveBeenCalledOnce();
});
