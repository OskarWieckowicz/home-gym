// @vitest-environment jsdom

import { StrictMode, useSyncExternalStore } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDefaultProject } from "@/features/project/defaults";
import { createDemoProject } from "@/features/project/demo-project";
import type { WebMcpModelContext, WebMcpTool } from "@/features/webmcp/types";
import { createLocalProjectStorage, LOCAL_PROJECT_STORAGE_KEY } from "../persistence/local-project-storage";
import { CreatorEntry } from "./creator-entry";

// Model Next's documented native-history -> useSearchParams subscription.
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(useSyncExternalStore(
    (notify) => {
      window.addEventListener("popstate", notify);
      return () => window.removeEventListener("popstate", notify);
    },
    () => window.location.search,
  )),
}));
vi.mock("next/dynamic", () => ({ default: () => () => <div>3D test scene</div> }));

let adapter: ReturnType<typeof createLocalProjectStorage>;
let memory: Storage;
const originalStorage = Object.getOwnPropertyDescriptor(window, "localStorage");
const originalModelContext = Object.getOwnPropertyDescriptor(document, "modelContext");

beforeEach(() => {
  const values = new Map<string, string>();
  memory = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() { return values.size; },
  };
  Object.defineProperty(window, "localStorage", { configurable: true, get: () => memory });
  adapter = createLocalProjectStorage(memory);
  window.history.replaceState(null, "", "/creator");
  const replace = window.history.replaceState.bind(window.history);
  vi.spyOn(window.history, "replaceState").mockImplementation((...args) => {
    replace(...args);
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  if (originalStorage) Object.defineProperty(window, "localStorage", originalStorage);
  if (originalModelContext) Object.defineProperty(document, "modelContext", originalModelContext);
  else Reflect.deleteProperty(document, "modelContext");
});

function navigate(url: string) {
  act(() => window.history.replaceState(null, "", url));
}
function editWidth(value: string) {
  fireEvent.change(screen.getByRole("spinbutton", { name: "Width (cm)" }), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "Apply room" }));
}
async function ready() { await screen.findByRole("button", { name: "Apply room" }); }
function storedProject() {
  const loaded = adapter.load();
  if (loaded.status !== "loaded") throw new Error("Expected a persisted baseline");
  return loaded.project;
}

describe("creator start navigation", () => {
  it("replaces the live WebMCP tools on explicit starts but not when consuming the URL", async () => {
    const active = new Map<string, WebMcpTool>();
    const registerTool = vi.fn<WebMcpModelContext["registerTool"]>(async (tool, options) => {
      active.set(tool.name, tool);
      options?.signal?.addEventListener("abort", () => {
        if (active.get(tool.name) === tool) active.delete(tool.name);
      });
    });
    Object.defineProperty(document, "modelContext", { configurable: true, value: { registerTool } });
    render(<StrictMode><CreatorEntry /></StrictMode>);
    await waitFor(() => expect(registerTool).toHaveBeenCalledTimes(21));
    for (const [index, mode] of ["demo", "new", "demo"].entries()) {
      const previousSignals = registerTool.mock.calls.slice(-21).map(([, options]) => options?.signal);
      navigate(`/creator?start=${mode}`);
      await waitFor(() => expect(window.location.search).toBe(""));
      await waitFor(() => expect(registerTool).toHaveBeenCalledTimes((index + 2) * 21));
      expect(previousSignals.every((signal) => signal?.aborted)).toBe(true);
      expect(active.size).toBe(21);
      expect(await active.get("get_project_state")!.execute({})).toMatchObject({
        revision: 0, canUndo: false,
        project: { projectItems: mode === "demo" ? createDemoProject().projectItems : [] },
      });
      editWidth("450");
      expect(await active.get("get_project_state")!.execute({})).toMatchObject({
        revision: 1, project: { room: { widthCm: 450 } },
      });
      expect(registerTool).toHaveBeenCalledTimes((index + 2) * 21);
    }
  });

  it.each([false, true])("opens and saves demo over existing storage=%s, consumes URL once and restores edits on reload", async (existing) => {
    if (existing) adapter.save({ ...createDefaultProject(), budget: 12345 });
    navigate("/creator?start=demo&campaign=example#creator-content");
    const save = vi.spyOn(memory, "setItem");
    const load = vi.spyOn(memory, "getItem");
    const first = render(<StrictMode><CreatorEntry /></StrictMode>);
    await ready();
    expect(load).not.toHaveBeenCalled();
    expect(save).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe("?campaign=example");
    expect(window.location.hash).toBe("#creator-content");
    expect(storedProject()).toEqual(createDemoProject());
    expect(screen.getByRole("button", { name: "3D" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: /Undo/ })).toHaveProperty("disabled", true);

    editWidth("450");
    expect(storedProject().room.widthCm).toBe(450);
    expect(screen.getByRole("button", { name: /Undo/ })).toHaveProperty("disabled", false);
    navigate("/creator");
    expect(screen.getByRole("button", { name: /Undo/ })).toHaveProperty("disabled", false);
    first.unmount();
    render(<CreatorEntry />);
    await ready();
    expect(screen.getByRole("spinbutton", { name: "Width (cm)" })).toHaveProperty("value", "450");
    expect(storedProject().placements).toHaveLength(4);
  });

  it("handles restore -> demo -> new -> demo -> demo without retaining an old store or history", async () => {
    adapter.save({ ...createDefaultProject(), room: { widthCm: 500, depthCm: 320, heightCm: 240 } });
    render(<CreatorEntry />);
    await ready();
    expect(screen.getByRole("spinbutton", { name: "Width (cm)" })).toHaveProperty("value", "500");
    for (const mode of ["demo", "new", "demo", "demo"]) {
      navigate(`/creator?start=${mode}`);
      await waitFor(() => expect(window.location.search).toBe(""));
      await ready();
      expect(storedProject()).toEqual(mode === "demo" ? createDemoProject() : createDefaultProject());
      expect(screen.getByRole("button", { name: /Undo/ })).toHaveProperty("disabled", true);
      editWidth("460");
    }
  });

  it.each(["", "?start=DEMO", "?start=", "?start=demo&start=new", "?start=demo&start=demo"])(
    "restores without writing for invalid/absent action %s", async (query) => {
      adapter.save({ ...createDefaultProject(), room: { widthCm: 475, depthCm: 320, heightCm: 240 } });
      navigate(`/creator${query}`);
      const save = vi.spyOn(memory, "setItem");
      render(<CreatorEntry />);
      await ready();
      expect(screen.getByRole("spinbutton", { name: "Width (cm)" })).toHaveProperty("value", "475");
      expect(save).not.toHaveBeenCalled();
      expect(window.location.search).toBe(query);
    },
  );

  it.each(["new", "demo"])("keeps %s editable and consumes the URL when saving fails, without deleting the older save", async (mode) => {
    adapter.save({ ...createDefaultProject(), budget: 12345 });
    const oldJson = window.localStorage.getItem(LOCAL_PROJECT_STORAGE_KEY);
    vi.spyOn(memory, "setItem").mockImplementation(() => { throw new DOMException("quota"); });
    navigate(`/creator?start=${mode}`);
    render(<CreatorEntry />);
    await ready();
    expect(await screen.findByText(/latest project could not be saved/i)).toBeTruthy();
    expect(window.location.search).toBe("");
    editWidth("455");
    navigate("/creator?other=value");
    expect(screen.getByRole("spinbutton", { name: "Width (cm)" })).toHaveProperty("value", "455");
    expect(screen.getByRole("button", { name: /Undo/ })).toHaveProperty("disabled", false);
    expect(window.localStorage.getItem(LOCAL_PROJECT_STORAGE_KEY)).toBe(oldJson);
  });

  it("starts an empty project in memory when localStorage is unavailable", async () => {
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => { throw new DOMException("denied"); });
    navigate("/creator?start=new");
    render(<CreatorEntry />);
    await ready();
    expect(await screen.findByText(/latest project could not be saved/i)).toBeTruthy();
    expect(window.location.search).toBe("");
    editWidth("430");
    expect(screen.getByRole("button", { name: /Undo/ })).toHaveProperty("disabled", false);
    // Restore the getter before cleanup accesses this test's storage.
    vi.restoreAllMocks();
  });
});
