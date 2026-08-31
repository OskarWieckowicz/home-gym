// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useEffect } from "react";
import { ProjectStoreProvider, useProjectStoreApi } from "@/features/creator/store/project-store-context";
import type { ProjectStore } from "@/features/creator/store/project-store";
import { ProjectPersistenceBoundary } from "@/features/creator/persistence/project-persistence-boundary";
import { createLocalProjectStorage } from "@/features/creator/persistence/local-project-storage";
import { createDemoProject } from "@/features/project/demo-project";
import { createDefaultProject } from "@/features/project/defaults";
import { serializeProject } from "@/features/project/serialization/project-codec";
import { buildProjectSummary } from "@/features/project/summary/project-summary";
import { findProjectProductById } from "@/features/catalog/queries/project-products";
import { SummaryView } from "./summary-view";

vi.mock("next/dynamic", () => ({ default: () => function SceneMock({ onFallback }: { onFallback: () => void }) {
  return <button onClick={onFallback}>Simulate graphics failure</button>;
} }));

let store: ProjectStore;
const exactText = { normalizer: (text: string) => text };
function CaptureStore() {
  const api = useProjectStoreApi();
  useEffect(() => { store = api; }, [api]);
  return null;
}
function openDemo(budget?: number) {
  const project = createDemoProject();
  render(<ProjectStoreProvider initialProject={budget === undefined ? project : { ...project, budget }}>
    <CaptureStore /><SummaryView />
  </ProjectStoreProvider>);
  const state = store.getState();
  return buildProjectSummary(state.project, state.validation, findProjectProductById);
}
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("SummaryView", () => {
  it("renders the same item rows, totals, goal coverage and checklist as the shared payload", () => {
    const summary = openDemo();
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(summary.items.length + 2);
    for (const item of summary.items) expect(within(table).getByRole("rowheader", { name: item.name })).toBeTruthy();
    expect(within(table).getByText(summary.totals.totalPriceLabel, exactText)).toBeTruthy();
    expect(screen.getByText(summary.totals.balanceLabel, exactText)).toBeTruthy();
    expect(screen.getByText(summary.coverage.countLabel)).toBeTruthy();
    for (const check of summary.checks) expect(screen.getByText(check.label)).toBeTruthy();
    expect(screen.getByText(summary.statusLabel).getAttribute("role")).toBe("status");
    expect(screen.getByRole("img", { name: "Read-only top-down room plan" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "2D" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getAllByRole("link", { name: "Back to editing" }).every((link) => link.getAttribute("href") === "/creator")).toBe(true);
  });

  it("reflects over-budget analysis and shared warning descriptions", () => {
    const summary = openDemo(100);
    expect(summary.totals.overBudget).toBe(true);
    expect(screen.getByText(summary.totals.balanceLabel, exactText)).toBeTruthy();
    for (const issue of summary.recommendations) expect(screen.getByText(issue.message, exactText)).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("value")).toBe("100");
  });

  it("shows the cost already included for pending floor equipment but not selection-only accessories", () => {
    const project = createDefaultProject();
    project.projectItems = [
      { id: "project-item_bench", productId: "product_arc_adjustable_bench" },
      { id: "project-item_roller", productId: "product_groundwork_foam_roller" },
    ];
    render(<ProjectStoreProvider initialProject={project}><SummaryView /></ProjectStoreProvider>);
    expect(screen.getByText("1 item not placed.")).toBeTruthy();
    expect(screen.getByText(/already included in the total cost/)).toBeTruthy();
    expect(screen.getByText("No floor placement needed")).toBeTruthy();
    expect(screen.queryByText("2 items not placed.")).toBeNull();
    expect(screen.getByRole("table")).toBeTruthy();
  });

  it("shows a content-based empty state without zero-filled tiles", () => {
    render(<ProjectStoreProvider initialProject={createDefaultProject()}><SummaryView /></ProjectStoreProvider>);
    expect(screen.getByRole("heading", { name: "Your project is waiting for equipment" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open creator" }).getAttribute("href")).toBe("/creator");
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("never dispatches on plan click, drag, drop, keyboard or view changes", () => {
    openDemo();
    const before = store.getState();
    const dispatch = vi.spyOn(before, "dispatch");
    const replace = vi.spyOn(before, "replaceProject");
    const plan = screen.getByRole("img", { name: "Read-only top-down room plan" });
    for (const entity of plan.querySelectorAll('[role="button"]')) {
      fireEvent.click(entity);
      fireEvent.pointerDown(entity, { pointerId: 1, clientX: 100, clientY: 100 });
      fireEvent.pointerMove(entity, { pointerId: 1, clientX: 300, clientY: 300 });
      fireEvent.pointerUp(entity, { pointerId: 1, clientX: 300, clientY: 300 });
      fireEvent.keyDown(entity, { key: "Enter" });
      expect(entity.getAttribute("tabindex")).toBe("-1");
    }
    fireEvent.drop(plan, { dataTransfer: { getData: () => "rack" } });
    fireEvent.click(screen.getByRole("button", { name: "3D" }));
    fireEvent.click(screen.getByRole("button", { name: "2D" }));
    expect(dispatch).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(store.getState()).toBe(before);
  });

  it("falls back to 2D after a graphics failure without changing the project", () => {
    openDemo();
    const before = store.getState();
    fireEvent.click(screen.getByRole("button", { name: "3D" }));
    fireEvent.click(screen.getByRole("button", { name: "Simulate graphics failure" }));
    expect(screen.getByRole("img", { name: "Read-only top-down room plan" })).toBeTruthy();
    expect(screen.getByText(/3D is unavailable/).getAttribute("role")).toBe("status");
    expect(screen.getByRole("button", { name: "3D" })).toHaveProperty("disabled", true);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "2D" }));
    expect(store.getState()).toBe(before);
  });

  it("exports canonical JSON with no import/reset controls and no mutation", async () => {
    openDemo();
    const before = store.getState();
    const createUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:summary");
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function(this: HTMLAnchorElement) {
      expect(this.download).toBe("home-gym-project-v4.json");
    });
    fireEvent.click(screen.getByRole("button", { name: "Export project" }));
    const blob = createUrl.mock.calls[0][0] as Blob;
    const json = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsText(blob);
    });
    const serialized = serializeProject(before.project);
    expect(serialized.success && json).toBe(serialized.success && serialized.json);
    expect(click).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith("blob:summary");
    expect(screen.queryByRole("button", { name: "Import" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Reset" })).toBeNull();
    expect(store.getState()).toBe(before);
  });
});

describe("summary persistence", () => {
  it("restores and reloads edited local data without any storage writes", async () => {
    const project = { ...createDemoProject(), budget: 4321 };
    const saved = serializeProject(project);
    if (!saved.success) throw new Error("Invalid fixture");
    const setItem = vi.fn();
    const removeItem = vi.fn();
    const storage = createLocalProjectStorage({ getItem: () => saved.json, setItem, removeItem });
    const tree = <ProjectPersistenceBoundary storage={storage}><CaptureStore /><SummaryView /></ProjectPersistenceBoundary>;
    const first = render(tree);
    await screen.findByText("Saved locally.");
    await waitFor(() => expect(store.getState().project).toEqual(project));
    fireEvent.click(screen.getByRole("button", { name: "3D" }));
    fireEvent.click(screen.getByRole("button", { name: "2D" }));
    first.unmount();
    render(tree);
    await screen.findByText("Saved locally.");
    await waitFor(() => expect(store.getState().project).toEqual(project));
    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
  });

  it("does not create a save on a cold visit", async () => {
    const save = vi.fn();
    const clear = vi.fn();
    render(<ProjectPersistenceBoundary storage={{ load: () => ({ status: "missing" }), save, clear }}><SummaryView /></ProjectPersistenceBoundary>);
    await screen.findByRole("heading", { name: "Your project is waiting for equipment" });
    await act(async () => undefined);
    expect(save).not.toHaveBeenCalled();
    expect(clear).not.toHaveBeenCalled();
  });
});
