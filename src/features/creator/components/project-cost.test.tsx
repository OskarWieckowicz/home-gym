// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { findProjectProductById } from "@/features/catalog/queries/project-products";
import { createDefaultProject } from "@/features/project/defaults";
import type { GymProject } from "@/features/project/schemas/project";
import { buildProjectSummary } from "@/features/project/summary/project-summary";
import type { ProjectStore } from "../store/project-store";
import { ProjectStoreProvider, useProjectStoreApi } from "../store/project-store-context";
import { useProjectShopping } from "../store/use-project-shopping";
import { PendingPlacementNotice } from "./pending-placement-notice";
import { ProjectCost } from "./project-cost";

let store: ProjectStore;
function CaptureStore() {
  const api = useProjectStoreApi();
  useEffect(() => { store = api; }, [api]);
  const { pending } = useProjectShopping();
  return <PendingPlacementNotice pending={pending} />;
}
function setup(project: GymProject = createDefaultProject()) {
  const onEditBudget = vi.fn();
  const onEditGoals = vi.fn();
  render(<ProjectStoreProvider initialProject={project}>
    <CaptureStore /><ProjectCost onEditBudget={onEditBudget} onEditGoals={onEditGoals} />
  </ProjectStoreProvider>);
  return { onEditBudget, onEditGoals };
}
function expectSharedCost() {
  const state = store.getState();
  const { totals } = buildProjectSummary(state.project, state.validation, findProjectProductById);
  const status = screen.getByRole("status");
  const exactText = { normalizer: (text: string) => text };
  expect(within(status).getByText(totals.totalPriceLabel, exactText)).toBeTruthy();
  expect(within(status).getByText(`Budget: ${totals.budgetLabel}`, exactText)).toBeTruthy();
  expect(within(status).getByText(totals.balanceLabel, exactText)).toBeTruthy();
  return totals;
}

afterEach(cleanup);

describe("ProjectCost", () => {
  it("announces only monetary content politely and invokes the existing settings callback without moving focus", () => {
    const { onEditBudget } = setup();
    const button = screen.getByRole("button", { name: "Edit budget" });
    button.focus();
    fireEvent.click(button);
    expect(onEditBudget).toHaveBeenCalledOnce();
    expect(onEditBudget).toHaveBeenCalledWith(button);
    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.getAttribute("aria-atomic")).toBe("true");
    expect(within(status).queryByRole("button")).toBeNull();
    expect(within(status).queryByText("Training goals")).toBeNull();
    act(() => { store.getState().dispatch({ type: "PROJECT_ITEM_ADDED", payload: { productId: "product_groundwork_foam_roller" } }); });
    expectSharedCost();
    expect(document.activeElement).toBe(button);
    expect(screen.queryByText(/item not placed/)).toBeNull();
  });

  it("offers a direct action to set empty goals and passes its trigger for return focus", () => {
    const { onEditGoals } = setup();
    expect(screen.getByRole("heading", { name: "Training goals" })).toBeTruthy();
    const trigger = screen.getByRole("button", { name: "Set training goals" });
    fireEvent.click(trigger);
    expect(onEditGoals).toHaveBeenCalledWith(trigger);
    expect(screen.queryByRole("button", { name: "Edit training goals" })).toBeNull();
    expect(within(screen.getByRole("status")).queryByText("Set training goals")).toBeNull();
  });

  it("shows readable goal labels from shared state and follows updates, undo, redo and import", () => {
    const { onEditGoals } = setup({ ...createDefaultProject(), trainingGoals: ["strength", "mobility"] });
    expect(screen.getByText("Strength · Mobility")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Set training goals" })).toBeNull();
    const trigger = screen.getByRole("button", { name: "Edit training goals" });
    trigger.focus();
    fireEvent.click(trigger);
    expect(onEditGoals).toHaveBeenCalledWith(trigger);
    act(() => { store.getState().dispatch({ type: "PROJECT_SETTINGS_UPDATED", payload: { trainingGoals: ["muscle-gain", "conditioning", "general-fitness"] } }); });
    expect(screen.getByText("Muscle gain · Conditioning · General fitness")).toBeTruthy();
    expect(document.activeElement).toBe(trigger);
    act(() => { store.getState().undo(); });
    expect(screen.getByText("Strength · Mobility")).toBeTruthy();
    act(() => { store.getState().redo(); });
    expect(screen.getByText("Muscle gain · Conditioning · General fitness")).toBeTruthy();
    act(() => { store.getState().replaceProject(createDefaultProject()); });
    expect(screen.getByRole("button", { name: "Set training goals" })).toBeTruthy();
    expect(screen.queryByText("Muscle gain · Conditioning · General fitness")).toBeNull();
    expect(screen.getByRole("button", { name: "Set training goals" })).toBe(trigger);
    expect(document.activeElement).toBe(trigger);
    act(() => { store.getState().dispatch({ type: "PROJECT_SETTINGS_UPDATED", payload: { trainingGoals: ["strength"] } }); });
    expect(screen.getByRole("button", { name: "Edit training goals" })).toBe(trigger);
    expect(document.activeElement).toBe(trigger);
  });

  it("matches summary after shared commands, placement/removal, undo/redo and imported replacement", () => {
    setup();
    expect(expectSharedCost().totalPrice).toBe(0);
    act(() => { store.getState().dispatch({ type: "PROJECT_ITEM_ADDED", payload: { productId: "product_arc_adjustable_bench" } }); });
    const price = expectSharedCost().totalPrice;
    expect(screen.getByText("1 item not placed.")).toBeTruthy();
    const itemId = store.getState().project.projectItems[0].id;
    act(() => { store.getState().dispatch({ type: "PROJECT_ITEM_PLACED", payload: { projectItemId: itemId, position: { xCm: 100, zCm: 100 }, rotation: 0 } }); });
    expect(expectSharedCost().totalPrice).toBe(price);
    expect(screen.queryByText("1 item not placed.")).toBeNull();
    act(() => { store.getState().dispatch({ type: "PLACEMENT_REMOVED", payload: { placementId: store.getState().project.placements[0].id } }); });
    expect(expectSharedCost().totalPrice).toBe(price);
    expect(screen.getByText("1 item not placed.")).toBeTruthy();
    act(() => { store.getState().dispatch({ type: "PROJECT_ITEM_REMOVED", payload: { projectItemId: itemId } }); });
    expect(expectSharedCost().totalPrice).toBe(0);
    act(() => { store.getState().undo(); });
    expect(expectSharedCost().totalPrice).toBe(price);
    act(() => { store.getState().redo(); });
    expect(expectSharedCost().totalPrice).toBe(0);
    act(() => { store.getState().replaceProject({ ...createDefaultProject(), budget: 0, projectItems: [{ id: "project-item_imported", productId: "product_groundwork_foam_roller" }] }); });
    expect(expectSharedCost()).toMatchObject({ totalPrice: 22, overBudget: true });
    expect(screen.getByRole("status").querySelector(".creator-project-cost-over")).toBeTruthy();
  });
});

describe("PendingPlacementNotice", () => {
  it("renders nothing for no pending equipment and explains known-only totals without creating a warning", () => {
    const pending = { count: 0, totalPrice: 0, complete: true, totalPriceLabel: "$0" };
    const view = render(<PendingPlacementNotice pending={pending} />);
    expect(view.container.textContent).toBe("");
    view.rerender(<PendingPlacementNotice pending={{ ...pending, count: 2, complete: false, totalPriceLabel: "$0 (known prices only)" }} />);
    expect(screen.getByText("2 items not placed.")).toBeTruthy();
    expect(view.container.textContent).toContain("$0 (known prices only) already included in the total cost.");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
