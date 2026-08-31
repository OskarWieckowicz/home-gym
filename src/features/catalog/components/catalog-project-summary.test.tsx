// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createLocalProjectStorage,
  LOCAL_PROJECT_STORAGE_KEY,
} from "@/features/creator/persistence/local-project-storage";
import { createDefaultProject } from "@/features/project/defaults";
import { readSavedCatalogProject } from "../saved-catalog-project";
import { formatPrice } from "./catalog-formatters";
import { CatalogProjectSummary } from "./catalog-project-summary";

const originalStorage = Object.getOwnPropertyDescriptor(window, "localStorage");
let memory: Storage;

beforeEach(() => {
  const values = new Map<string, string>();
  memory = {
    get length() { return values.size; },
    key: (index) => [...values.keys()][index] ?? null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
    clear: () => values.clear(),
  };
  Object.defineProperty(window, "localStorage", { configurable: true, get: () => memory });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  if (originalStorage) Object.defineProperty(window, "localStorage", originalStorage);
  else Reflect.deleteProperty(window, "localStorage");
});

function savedProject() {
  return {
    ...createDefaultProject(),
    room: { widthCm: 410, depthCm: 320, heightCm: 260 },
    budget: 0,
    projectItems: [
      { id: "project-item_bench", productId: "product_pivot_flat_bench" },
      { id: "project-item_bands", productId: "product_signal_resistance_bands" },
    ],
  };
}

describe("catalog saved project context", () => {
  it("reads real dimensions, zero budget and all purchased items without writing in StrictMode", async () => {
    const storage = createLocalProjectStorage(window.localStorage);
    expect(storage.save(savedProject()).success).toBe(true);
    const saved = window.localStorage.getItem(LOCAL_PROJECT_STORAGE_KEY);
    const save = vi.spyOn(memory, "setItem");
    const remove = vi.spyOn(memory, "removeItem");
    render(<StrictMode><CatalogProjectSummary /></StrictMode>);

    await screen.findByRole("heading", { name: "Your saved project" });
    expect(screen.getByText("410 × 320 × 260 cm")).toBeTruthy();
    expect(screen.getByText(formatPrice(0), { normalizer: (value) => value })).toBeTruthy();
    expect(screen.getByText("2 items")).toBeTruthy();
    expect(screen.getByText(/Includes unplaced equipment and accessories/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Continue project" }).getAttribute("href")).toBe("/creator");
    expect(save).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(LOCAL_PROJECT_STORAGE_KEY)).toBe(saved);
  });

  it("does not invent or initialize a room when there is no saved project", async () => {
    const save = vi.spyOn(memory, "setItem");
    render(<CatalogProjectSummary />);
    await screen.findByText(/No saved project yet/);
    expect(screen.queryByText("Budget")).toBeNull();
    expect(screen.getByRole("link", { name: "Open creator" })).toBeTruthy();
    expect(save).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(LOCAL_PROJECT_STORAGE_KEY)).toBeNull();
  });

  it.each(["broken-json", "unknown-product"])("shows an invalid saved state without changing %s data", async (kind) => {
    if (kind === "broken-json") window.localStorage.setItem(LOCAL_PROJECT_STORAGE_KEY, "{broken");
    else {
      const project = savedProject();
      project.projectItems[0].productId = "product_missing";
      createLocalProjectStorage(window.localStorage).save(project);
    }
    const before = window.localStorage.getItem(LOCAL_PROJECT_STORAGE_KEY);
    render(<CatalogProjectSummary />);
    await screen.findByText(/Your saved project could not be restored/);
    expect(screen.queryByText("2 items")).toBeNull();
    expect(window.localStorage.getItem(LOCAL_PROJECT_STORAGE_KEY)).toBe(before);
  });

  it.each(["access", "read"])("explains unavailable storage when %s is blocked", async (failure) => {
    if (failure === "access") {
      vi.spyOn(window, "localStorage", "get").mockImplementation(() => { throw new Error("Blocked"); });
    } else vi.spyOn(memory, "getItem").mockImplementation(() => { throw new Error("Blocked"); });
    render(<CatalogProjectSummary />);
    await screen.findByText(/Saved project unavailable/);
    expect(screen.getByRole("link", { name: "Open creator" })).toBeTruthy();
    expect(screen.queryByText(/No saved project yet/)).toBeNull();
  });

  it("refreshes on returning to the page and cross-tab saves or clears, and cleans up listeners", async () => {
    const storage = createLocalProjectStorage(window.localStorage);
    const view = render(<CatalogProjectSummary />);
    await screen.findByText(/No saved project yet/);
    storage.save(savedProject());
    act(() => window.dispatchEvent(new Event("focus")));
    expect(screen.getByText("2 items")).toBeTruthy();

    storage.save({ ...savedProject(), budget: 12500 });
    act(() => window.dispatchEvent(new StorageEvent("storage", { key: "unrelated" })));
    expect(screen.getByText(formatPrice(0), { normalizer: (value) => value })).toBeTruthy();
    act(() => window.dispatchEvent(new StorageEvent("storage", { key: LOCAL_PROJECT_STORAGE_KEY })));
    expect(screen.getByText(formatPrice(12500), { normalizer: (value) => value })).toBeTruthy();

    storage.save({ ...savedProject(), projectItems: [] });
    act(() => window.dispatchEvent(new Event("pageshow")));
    expect(screen.getByText("0 items")).toBeTruthy();
    window.localStorage.clear();
    act(() => window.dispatchEvent(new StorageEvent("storage", { key: null })));
    expect(screen.getByText(/No saved project yet/)).toBeTruthy();

    view.unmount();
    const read = vi.spyOn(memory, "getItem");
    window.dispatchEvent(new Event("focus"));
    window.dispatchEvent(new Event("pageshow"));
    window.dispatchEvent(new StorageEvent("storage", { key: LOCAL_PROJECT_STORAGE_KEY }));
    expect(read).not.toHaveBeenCalled();
  });

  it("reconciles legacy accessory placements like the creator while retaining purchases and saved bytes", () => {
    const project = {
      ...savedProject(),
      placements: [{
        id: "placement_bands", projectItemId: "project-item_bands", locked: false,
        position: { xCm: 100, zCm: 100 }, rotation: 0 as const,
      }],
    };
    const storage = createLocalProjectStorage(window.localStorage);
    expect(storage.save(project).success).toBe(true);
    const before = window.localStorage.getItem(LOCAL_PROJECT_STORAGE_KEY);
    const snapshot = readSavedCatalogProject(storage);
    expect(snapshot).toMatchObject({ kind: "saved", project: { projectItems: project.projectItems, placements: [] } });
    expect(window.localStorage.getItem(LOCAL_PROJECT_STORAGE_KEY)).toBe(before);
  });
});
