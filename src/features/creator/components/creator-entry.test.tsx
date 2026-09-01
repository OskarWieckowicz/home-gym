// @vitest-environment jsdom

import { StrictMode, useSyncExternalStore } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDefaultProject } from "@/features/project/defaults";
import { createDemoProject } from "@/features/project/demo-project";
import type { WebMcpModelContext, WebMcpTool } from "@/features/webmcp/types";
import { createLocalProjectStorage, LOCAL_PROJECT_STORAGE_KEY } from "../persistence/local-project-storage";
import { CreatorEntry } from "./creator-entry";
import { mockNativeDialog } from "./test-dialog";

mockNativeDialog();

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
async function confirmStart() {
  fireEvent.click(await screen.findByRole("button", { name: /^Replace with/ }));
}
async function ready() { await screen.findByRole("button", { name: "Apply room" }); }
function storedProject() {
  const loaded = adapter.load();
  if (loaded.status !== "loaded") throw new Error("Expected a persisted baseline");
  return loaded.project;
}

describe("saved project start protection", () => {
  it.each(["new", "demo"])("protects the saved project across a pending %s start and reload, with safe cancellation", async (mode) => {
    const saved = { ...createDefaultProject(), room: { widthCm: 485, depthCm: 320, heightCm: 240 } };
    adapter.save(saved);
    const oldJson = memory.getItem(LOCAL_PROJECT_STORAGE_KEY);
    const save = vi.spyOn(memory, "setItem");
    const clear = vi.spyOn(memory, "removeItem");
    const registerTool = vi.fn<WebMcpModelContext["registerTool"]>(async () => {});
    Object.defineProperty(document, "modelContext", { configurable: true, value: { registerTool } });
    navigate(`/creator?start=${mode}&campaign=keep#creator-content`);
    const first = render(<StrictMode><CreatorEntry /></StrictMode>);
    const keep = await screen.findByRole("button", { name: "Keep my project" });
    expect(document.activeElement).toBe(keep);
    expect(screen.queryByRole("button", { name: "Apply room" })).toBeNull();
    expect(registerTool).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
    expect(clear).not.toHaveBeenCalled();
    expect(memory.getItem(LOCAL_PROJECT_STORAGE_KEY)).toBe(oldJson);
    expect(window.location.search).toBe(`?start=${mode}&campaign=keep`);

    // Reload before making a decision must still protect the durable project.
    first.unmount();
    render(<StrictMode><CreatorEntry /></StrictMode>);
    fireEvent.click(await screen.findByRole("button", { name: "Keep my project" }));
    await ready();
    expect(screen.getByRole("spinbutton", { name: "Width (cm)" })).toHaveProperty("value", "485");
    expect(window.location.search).toBe("?campaign=keep");
    expect(window.location.hash).toBe("#creator-content");
    expect(save).not.toHaveBeenCalled();
    expect(clear).not.toHaveBeenCalled();
    expect(memory.getItem(LOCAL_PROJECT_STORAGE_KEY)).toBe(oldJson);
    await waitFor(() => expect(registerTool).toHaveBeenCalledTimes(20));
  });

  it.each(["keydown", "cancel"])("treats %s dismissal as keeping the saved project for a same-route start", async (eventType) => {
    adapter.save(createDefaultProject());
    render(<CreatorEntry />);
    await ready();
    editWidth("490");
    const oldJson = memory.getItem(LOCAL_PROJECT_STORAGE_KEY);
    const save = vi.spyOn(memory, "setItem");
    navigate("/creator?start=demo&other=keep#room");
    const dialog = await screen.findByRole("dialog", { name: "Replace your saved project?" });
    if (eventType === "keydown") fireEvent.keyDown(dialog, { key: "Escape" });
    else fireEvent(dialog, new Event("cancel", { bubbles: true, cancelable: true }));
    await ready();
    expect(screen.getByRole("spinbutton", { name: "Width (cm)" })).toHaveProperty("value", "490");
    expect(window.location.search).toBe("?other=keep");
    expect(window.location.hash).toBe("#room");
    expect(save).not.toHaveBeenCalled();
    expect(memory.getItem(LOCAL_PROJECT_STORAGE_KEY)).toBe(oldJson);
  });

  it.each(["new", "demo"])("does not overwrite corrupt storage for a %s start", async (mode) => {
    memory.setItem(LOCAL_PROJECT_STORAGE_KEY, "not valid JSON");
    const save = vi.spyOn(memory, "setItem");
    const clear = vi.spyOn(memory, "removeItem");
    navigate(`/creator?start=${mode}&other=keep#room`);
    render(<CreatorEntry />);
    await ready();
    expect(screen.getByText(/saved project is invalid/i)).toBeTruthy();
    expect(window.location.search).toBe("?other=keep");
    expect(window.location.hash).toBe("#room");
    expect(save).not.toHaveBeenCalled();
    expect(clear).not.toHaveBeenCalled();
    expect(memory.getItem(LOCAL_PROJECT_STORAGE_KEY)).toBe("not valid JSON");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not write when an explicit start cannot read the saved project", async () => {
    adapter.save(createDefaultProject());
    vi.spyOn(memory, "getItem").mockImplementation(() => { throw new DOMException("denied"); });
    const save = vi.spyOn(memory, "setItem");
    navigate("/creator?start=demo");
    render(<CreatorEntry />);
    await ready();
    expect(screen.getByText(/local saving is unavailable/i)).toBeTruthy();
    expect(window.location.search).toBe("");
    expect(save).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

});

describe("saved project changes during confirmation", () => {
  it.each(["keep", "escape"])("reloads the latest saved project on %s before allowing edits", async (dismissal) => {
    adapter.save(createDefaultProject());
    navigate("/creator?start=demo&other=keep#room");
    render(<StrictMode><CreatorEntry /></StrictMode>);
    const dialog = await screen.findByRole("dialog", { name: "Replace your saved project?" });
    const latest = { ...createDefaultProject(), budget: 12345, room: { widthCm: 485, depthCm: 320, heightCm: 240 } };
    adapter.save(latest);
    const save = vi.spyOn(memory, "setItem");
    if (dismissal === "escape") fireEvent.keyDown(dialog, { key: "Escape" });
    else fireEvent.click(screen.getByRole("button", { name: "Keep my project" }));
    await ready();
    expect(screen.getByRole("spinbutton", { name: "Width (cm)" })).toHaveProperty("value", "485");
    expect(storedProject()).toEqual(latest);
    expect(save).not.toHaveBeenCalled();
    expect(window.location.search).toBe("?other=keep");
    expect(window.location.hash).toBe("#room");
    editWidth("490");
    expect(storedProject()).toEqual({ ...latest, room: { ...latest.room, widthCm: 490 } });
  });

  it.each(["unreadable", "invalid", "removed"])("uses the normal recovery path when a saved project becomes %s before cancellation", async (change) => {
    adapter.save({ ...createDefaultProject(), room: { widthCm: 485, depthCm: 320, heightCm: 240 } });
    navigate("/creator?start=demo");
    render(<CreatorEntry />);
    const keep = await screen.findByRole("button", { name: "Keep my project" });
    if (change === "unreadable") vi.spyOn(memory, "getItem").mockImplementation(() => { throw new DOMException("denied"); });
    else if (change === "invalid") memory.setItem(LOCAL_PROJECT_STORAGE_KEY, "not JSON");
    else memory.removeItem(LOCAL_PROJECT_STORAGE_KEY);
    const save = vi.spyOn(memory, "setItem");
    const clear = vi.spyOn(memory, "removeItem");
    fireEvent.click(keep);
    await ready();
    const message = change === "unreadable" ? /local saving is unavailable/i
      : change === "invalid" ? /saved project is invalid/i : /Local saving ready/i;
    expect(screen.getByText(message)).toBeTruthy();
    expect(screen.getByRole("spinbutton", { name: "Width (cm)" })).toHaveProperty("value", String(createDefaultProject().room.widthCm));
    expect(window.location.search).toBe("");
    expect(save).not.toHaveBeenCalled();
    expect(clear).not.toHaveBeenCalled();
  });
});

describe("creator catalog navigation", () => {
  it("keeps the saved project and only activates a nonmutating product intent after cancelling a start", async () => {
    const saved = { ...createDefaultProject(), budget: 12345 };
    adapter.save(saved);
    const save = vi.spyOn(memory, "setItem");
    navigate("/creator?start=demo&product=product_arc_adjustable_bench&other=keep#room");
    render(<StrictMode><CreatorEntry /></StrictMode>);
    fireEvent.click(await screen.findByRole("button", { name: "Keep my project" }));
    const cancelPlacement = await screen.findByRole("button", { name: "Cancel placing Arc Adjustable Bench" });
    expect(document.activeElement).toBe(cancelPlacement);
    expect(storedProject()).toEqual(saved);
    expect(save).not.toHaveBeenCalled();
    expect(window.location.search).toBe("?other=keep");
    expect(window.location.hash).toBe("#room");
    expect(screen.getByRole("button", { name: "Undo" })).toHaveProperty("disabled", true);
  });

  it("restores before selecting a product, keeps history/tools and consumes repeated intents under StrictMode", async () => {
    const project = { ...createDefaultProject(), budget: 12345 };
    adapter.save(project);
    const save = vi.spyOn(memory, "setItem");
    const registerTool = vi.fn<WebMcpModelContext["registerTool"]>(async () => {});
    Object.defineProperty(document, "modelContext", { configurable: true, value: { registerTool } });
    navigate("/creator?product=product_arc_adjustable_bench&campaign=catalog#creator-content");
    render(<StrictMode><CreatorEntry /></StrictMode>);
    const cancel = await screen.findByRole("button", { name: "Cancel placing Arc Adjustable Bench" });
    await waitFor(() => expect(window.location.search).toBe("?campaign=catalog"));
    expect(document.activeElement).toBe(cancel);
    expect(window.location.hash).toBe("#creator-content");
    expect(storedProject()).toEqual(project);
    expect(save).not.toHaveBeenCalled();
    expect(registerTool).toHaveBeenCalledTimes(20);
    fireEvent.click(cancel);
    expect(save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("tab", { name: "Room" }));
    fireEvent.click(screen.getByRole("button", { name: "Room dimensions" }));
    editWidth("470");
    fireEvent.click(screen.getByRole("tab", { name: "Equipment" }));
    fireEvent.change(screen.getByRole("searchbox", { name: "Search equipment" }), { target: { value: "nonmatching" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Equipment category" }), { target: { value: "racks" } });
    fireEvent.click(screen.getByRole("tab", { name: "Project items" }));

    navigate("/creator?product=product_arc_adjustable_bench");
    expect(await screen.findByRole("button", { name: "Cancel placing Arc Adjustable Bench" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Equipment category" })).toHaveProperty("value", "");
    expect(storedProject().room.widthCm).toBe(470);
    expect(storedProject().projectItems).toHaveLength(0);
    expect(registerTool).toHaveBeenCalledTimes(20);
    expect(screen.getByRole("button", { name: "Undo" })).toHaveProperty("disabled", false);
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(storedProject().room.widthCm).toBe(project.room.widthCm);
  });

  it("focuses accessories but only adds them after an explicit action and does not replay on refresh", async () => {
    adapter.save(createDefaultProject());
    const save = vi.spyOn(memory, "setItem");
    navigate("/creator?product=product_signal_resistance_bands");
    const first = render(<StrictMode><CreatorEntry /></StrictMode>);
    await waitFor(() => expect(window.location.search).toBe(""));
    const add = screen.getByRole("button", { name: "Add to list: Signal Resistance Bands" });
    expect(document.activeElement).toBe(add);
    expect(save).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /Cancel placing/ })).toBeNull();
    fireEvent.click(add);
    expect(storedProject().projectItems).toHaveLength(1);
    expect(storedProject().placements).toHaveLength(0);
    expect(save).toHaveBeenCalledTimes(1);
    first.unmount();
    render(<CreatorEntry />);
    await ready();
    expect(save).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("searchbox", { name: "Search equipment" })).toHaveProperty("value", "");
  });

  it.each(["new", "demo"])("applies a product intent after the explicit %s start", async (mode) => {
    adapter.save({ ...createDefaultProject(), budget: 1 });
    const save = vi.spyOn(memory, "setItem");
    navigate(`/creator?start=${mode}&product=product_arc_adjustable_bench&other=keep#room`);
    render(<StrictMode><CreatorEntry /></StrictMode>);
    await confirmStart();
    await screen.findByRole("button", { name: "Cancel placing Arc Adjustable Bench" });
    expect(window.location.search).toBe("?other=keep");
    expect(window.location.hash).toBe("#room");
    expect(storedProject()).toEqual(mode === "demo" ? createDemoProject() : createDefaultProject());
    expect(save).toHaveBeenCalledTimes(1);
  });

  it.each(["unknown", "", "product_cove_wrist_wraps", "product_arc_adjustable_bench&product=product_arc_adjustable_bench"])(
    "ignores invalid or retired product intent %s without writes", async (product) => {
      adapter.save(createDefaultProject());
      const save = vi.spyOn(memory, "setItem");
      navigate(`/creator?product=${product}`);
      render(<CreatorEntry />);
      await ready();
      expect(screen.queryByRole("button", { name: /Cancel placing/ })).toBeNull();
      expect(screen.getByRole("searchbox", { name: "Search equipment" })).toHaveProperty("value", "");
      expect(save).not.toHaveBeenCalled();
    },
  );

});

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
    await waitFor(() => expect(registerTool).toHaveBeenCalledTimes(20));
    for (const [index, mode] of ["demo", "new", "demo"].entries()) {
      const previousSignals = registerTool.mock.calls.slice(-20).map(([, options]) => options?.signal);
      navigate(`/creator?start=${mode}`);
      if (index > 0) await confirmStart();
      await waitFor(() => expect(window.location.search).toBe(""));
      await waitFor(() => expect(registerTool).toHaveBeenCalledTimes((index + 2) * 20));
      expect(previousSignals.every((signal) => signal?.aborted)).toBe(true);
      expect(active.size).toBe(20);
      expect(await active.get("get_project_state")!.execute({})).toMatchObject({
        revision: 0, canUndo: false,
        project: { projectItems: mode === "demo" ? createDemoProject().projectItems : [] },
      });
      editWidth("450");
      expect(await active.get("get_project_state")!.execute({})).toMatchObject({
        revision: 1, project: { room: { widthCm: 450 } },
      });
      expect(registerTool).toHaveBeenCalledTimes((index + 2) * 20);
    }
  });

  it.each([false, true])("opens and saves demo over existing storage=%s, consumes URL once and restores edits on reload", async (existing) => {
    if (existing) adapter.save({ ...createDefaultProject(), budget: 12345 });
    navigate("/creator?start=demo&campaign=example#creator-content");
    const save = vi.spyOn(memory, "setItem");
    const load = vi.spyOn(memory, "getItem");
    const first = render(<StrictMode><CreatorEntry /></StrictMode>);
    if (existing) await confirmStart();
    await ready();
    expect(load).toHaveBeenCalledTimes(1);
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
    expect(storedProject().placements).toEqual(createDemoProject().placements);
  });

  it("handles restore -> demo -> new -> demo -> demo without retaining an old store or history", async () => {
    adapter.save({ ...createDefaultProject(), room: { widthCm: 500, depthCm: 320, heightCm: 240 } });
    render(<CreatorEntry />);
    await ready();
    expect(screen.getByRole("spinbutton", { name: "Width (cm)" })).toHaveProperty("value", "500");
    for (const mode of ["demo", "new", "demo", "demo"]) {
      navigate(`/creator?start=${mode}`);
      await confirmStart();
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
    await confirmStart();
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
    expect(await screen.findByText(/local saving is unavailable/i)).toBeTruthy();
    expect(window.location.search).toBe("");
    editWidth("430");
    expect(screen.getByRole("button", { name: /Undo/ })).toHaveProperty("disabled", false);
    // Restore the getter before cleanup accesses this test's storage.
    vi.restoreAllMocks();
  });
});
