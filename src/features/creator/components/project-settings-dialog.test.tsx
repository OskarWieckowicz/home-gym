// @vitest-environment jsdom

import { StrictMode } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createDefaultProject } from "@/features/project/defaults";
import type { ScenePreviewProps } from "../scene/scene-preview";
import { CreatorEditor } from "./creator-editor";
import { mockNativeDialog } from "./test-dialog";

const probe = vi.hoisted(() => vi.fn());
vi.mock("next/dynamic", () => ({
  default: () => function SceneProbe(props: ScenePreviewProps) {
    probe(props);
    return <button onClick={() => props.onSelect(props.project.placements[0]?.id ?? null)}>Select first equipment</button>;
  },
}));
mockNativeDialog();

const dialog = () => screen.getByRole("dialog", { name: "Project settings" });
const store = () => (probe.mock.lastCall![0] as ScenePreviewProps).store;
const changeBudget = (value: string) => fireEvent.change(screen.getByRole("spinbutton", { name: "Budget" }), { target: { value } });
const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));

describe("Project settings dialog", () => {
  it("opens directly from cost, focuses budget and discards a cancelled draft without history", () => {
    render(<CreatorEditor initialProject={createDefaultProject()} />);
    const initial = store().getState().project;
    const opener = screen.getByRole("button", { name: "Edit budget" });
    click("Edit budget");
    expect(dialog()).toHaveProperty("open", true);
    expect(document.activeElement).toBe(screen.getByRole("spinbutton", { name: "Budget" }));
    changeBudget("15000");
    fireEvent.click(screen.getByRole("checkbox", { name: "Strength" }));
    click("Cancel");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
    expect(store().getState()).toMatchObject({ project: initial, revision: 0, canUndo: false });
    click("Edit budget");
    expect(screen.getByRole("spinbutton", { name: "Budget" })).toHaveProperty("value", "10000");
    expect(screen.getByRole("checkbox", { name: "Strength" })).toHaveProperty("checked", false);
  });

  it("focuses goals and saves budget plus goals as one undoable command, including zero", () => {
    render(<CreatorEditor initialProject={createDefaultProject()} />);
    const opener = screen.getByRole("button", { name: "Set training goals" });
    click("Set training goals");
    expect(document.activeElement).toBe(screen.getByRole("checkbox", { name: "Strength" }));
    changeBudget("0");
    fireEvent.click(screen.getByRole("checkbox", { name: "Strength" }));
    click("Apply settings");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(store().getState()).toMatchObject({ revision: 1, project: { budget: 0, trainingGoals: ["strength"] } });
    expect(document.activeElement).toBe(opener);
    expect(opener).toBe(screen.getByRole("button", { name: "Edit training goals" }));
    expect(screen.getByText("Strength")).toBeTruthy();
    click("Undo");
    expect(store().getState()).toMatchObject({ canUndo: false, project: { budget: 10000, trainingGoals: [] } });
    click("Redo");
    expect(store().getState()).toMatchObject({ project: { budget: 0, trainingGoals: ["strength"] } });
  });

  it("opens through Project → Settings, closes the disclosure, and returns focus to Project", () => {
    render(<CreatorEditor initialProject={createDefaultProject()} />);
    click("Project");
    click("Settings");
    expect(dialog()).toBeTruthy();
    expect(screen.getByRole("button", { name: "Project" }).getAttribute("aria-expanded")).toBe("false");
    click("Close project settings");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Project" }));
    expect(store().getState().revision).toBe(0);
  });

  it("closes on native Escape cancellation and isolates Escape from scene keyboard handlers", () => {
    render(<CreatorEditor initialProject={createDefaultProject()} />);
    click("Edit budget");
    changeBudget("14000");
    const onKey = vi.fn();
    window.addEventListener("keydown", onKey);
    fireEvent.keyDown(screen.getByRole("spinbutton", { name: "Budget" }), { key: "Escape" });
    expect(onKey).not.toHaveBeenCalled();
    window.removeEventListener("keydown", onKey);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(store().getState()).toMatchObject({ revision: 0, project: { budget: 10000 } });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Edit budget" }));
    click("Edit budget");
    fireEvent(dialog(), new Event("cancel", { cancelable: true }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it.each(["", "-1", "1.5"])("rejects invalid budget %s and keeps the dialog open", (value) => {
    render(<CreatorEditor initialProject={createDefaultProject()} />);
    click("Edit budget");
    changeBudget(value);
    click("Apply settings");
    expect(within(dialog()).getByRole("alert").textContent).toContain("non-negative whole number");
    expect(store().getState().revision).toBe(0);
  });

  it("closes unchanged settings without creating undo history", () => {
    render(<CreatorEditor initialProject={createDefaultProject()} />);
    click("Edit budget");
    click("Apply settings");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(store().getState()).toMatchObject({ revision: 0, canUndo: false });
  });

  it("keeps failed saves open and reports the command error", () => {
    render(<CreatorEditor initialProject={createDefaultProject()} />);
    click("Edit budget");
    changeBudget("12000");
    vi.spyOn(store().getState(), "dispatch").mockReturnValueOnce({ ok: false, revision: 0, commandType: "PROJECT_SETTINGS_UPDATED", error: { code: "EXECUTION_FAILED", message: "Settings could not be saved." } });
    click("Apply settings");
    expect(within(dialog()).getByRole("alert").textContent).toBe("Settings could not be saved.");
    expect(store().getState().revision).toBe(0);
  });

  it("preserves equipment selection, view and the inspector when settings open and close", () => {
    const project = createDefaultProject();
    project.projectItems = [{ id: "project-item_bench", productId: "product_arc_adjustable_bench" }];
    project.placements = [{ locked: false, id: "placement_bench", projectItemId: "project-item_bench", position: { xCm: 100, zCm: 100 }, rotation: 0 }];
    render(<CreatorEditor initialProject={project} />);
    click("Select first equipment");
    const position = screen.getByRole("spinbutton", { name: "X (cm)" });
    fireEvent.change(position, { target: { value: "120" } });
    click("Edit budget");
    click("Cancel");
    expect(screen.getByRole("spinbutton", { name: "X (cm)" })).toBe(position);
    expect(position).toHaveProperty("value", "120");
    click("Edit budget");
    changeBudget("14000");
    click("Apply settings");
    expect(probe).toHaveBeenLastCalledWith(expect.objectContaining({ selectedId: "placement_bench" }));
    expect(screen.getByText("Selected equipment")).toBeTruthy();
    expect(screen.getByRole("button", { name: "3D" }).getAttribute("aria-pressed")).toBe("true");
    click("2D");
    click("Set training goals");
    click("Cancel");
    expect(screen.getByRole("button", { name: "2D" }).getAttribute("aria-pressed")).toBe("true");
  });

  it.each(["3D", "2D"])("cancels pending placement in %s without purchasing or adding history", (view) => {
    render(<CreatorEditor initialProject={createDefaultProject()} />);
    click(view);
    click("Place Northstar Half Rack");
    click("Edit budget");
    click("Cancel");
    expect(screen.queryByRole("button", { name: "Cancel placing Northstar Half Rack" })).toBeNull();
    expect(store().getState()).toMatchObject({ revision: 0, canUndo: false, project: { projectItems: [], placements: [] } });
  });

  it("keeps draft settings and focus through unrelated project edits", () => {
    render(<CreatorEditor initialProject={createDefaultProject()} />);
    click("Edit budget");
    changeBudget("12000");
    fireEvent.click(screen.getByRole("checkbox", { name: "Strength" }));
    const input = screen.getByRole("spinbutton", { name: "Budget" });
    act(() => { expect(store().getState().dispatch({ type: "ROOM_CONFIGURED", payload: { widthCm: 450, depthCm: 320, heightCm: 240 } })).toMatchObject({ ok: true, changed: true }); });
    expect(screen.getByRole("spinbutton", { name: "Budget" })).toBe(input);
    expect(input).toHaveProperty("value", "12000");
    expect(document.activeElement).toBe(input);
    expect(screen.getByRole("checkbox", { name: "Strength" })).toHaveProperty("checked", true);
    click("Apply settings");
    expect(store().getState()).toMatchObject({ revision: 2, project: { budget: 12000, room: { widthCm: 450 }, trainingGoals: ["strength"] } });
  });

  it.each(["command", "import", "undo"])("requires an explicit reload after concurrent settings change via %s", (source) => {
    render(<CreatorEditor initialProject={createDefaultProject()} />);
    if (source === "undo") act(() => { store().getState().dispatch({ type: "PROJECT_SETTINGS_UPDATED", payload: { budget: 18000, trainingGoals: ["mobility"] } }); });
    click("Edit budget");
    changeBudget("12000");
    act(() => {
      const current = store().getState();
      if (source === "import") current.replaceProject({ ...createDefaultProject(), budget: 18000, trainingGoals: ["mobility"] });
      else if (source === "undo") current.undo();
      else current.dispatch({ type: "PROJECT_SETTINGS_UPDATED", payload: { budget: 18000, trainingGoals: ["mobility"] } });
    });
    const revision = store().getState().revision;
    expect(within(dialog()).getByRole("alert").textContent).toContain("settings changed");
    expect(screen.getByRole("spinbutton", { name: "Budget" })).toHaveProperty("value", "12000");
    expect(screen.getByRole("button", { name: "Apply settings" })).toHaveProperty("disabled", true);
    fireEvent.submit(dialog().querySelector("form")!);
    expect(store().getState().revision).toBe(revision);
    click("Reload current settings");
    const expected = source === "undo" ? 10000 : 18000;
    expect(screen.getByRole("spinbutton", { name: "Budget" })).toHaveProperty("value", String(expected));
    expect(document.activeElement).toBe(screen.getByRole("spinbutton", { name: "Budget" }));
    changeBudget("15000");
    click("Apply settings");
    expect(store().getState()).toMatchObject({ revision: revision + 1, project: { budget: 15000, trainingGoals: source === "undo" ? [] : ["mobility"] } });
  });

  it("stays open across Strict Mode effect replay and ignores a stale native close event", async () => {
    render(<StrictMode><CreatorEditor initialProject={createDefaultProject()} /></StrictMode>);
    click("Edit budget");
    await act(async () => { await Promise.resolve(); });
    fireEvent(dialog(), new Event("close"));
    expect(dialog()).toHaveProperty("open", true);
    expect(document.activeElement).toBe(screen.getByRole("spinbutton", { name: "Budget" }));
  });
});
