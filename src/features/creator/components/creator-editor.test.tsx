// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createDefaultProject } from "@/features/project/defaults";

import { CreatorEditor } from "./creator-editor";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function change(name: string, value: string) {
  fireEvent.change(screen.getByRole("spinbutton", { name }), { target: { value } });
}

describe("CreatorEditor", () => {
  it("switches presentation views without creating project history", () => {
    render(<CreatorEditor initialProject={createDefaultProject()} />);
    fireEvent.click(screen.getByRole("button", { name: "3D" }));
    expect(screen.getByRole("button", { name: "3D" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: /Undo/ })).toHaveProperty("disabled", true);
    fireEvent.click(screen.getByRole("button", { name: "2D" }));
    expect(screen.getByRole("group", { name: "Top-down editable room plan" })).toBeTruthy();
  });

  it("places floor areas directly and preserves locking, validation, undo and redo", () => {
    const ids = ["obstacle_wardrobe", "obstacle_zone"];
    const { container } = render(<CreatorEditor dependencies={{ generateObstacleId: () => ids.shift() ?? "obstacle_fallback" }} initialProject={createDefaultProject()} />);
    const plan = screen.getByRole("group", { name: "Top-down editable room plan" });
    Object.defineProperty(plan, "getBoundingClientRect", { value: () => ({
      bottom: 560, height: 560, left: 0, right: 760, top: 0, width: 760,
      x: 0, y: 0, toJSON: () => undefined,
    }) });

    fireEvent.click(screen.getByRole("button", { name: "Project settings" }));
    change("Budget", "12500");
    fireEvent.click(screen.getByRole("checkbox", { name: "Strength" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply settings" }));
    expect(screen.getByRole("button", { name: /Undo/ })).not.toHaveProperty("disabled", true);

    fireEvent.click(screen.getByRole("button", { name: "Physical obstacle" }));
    fireEvent.pointerDown(plan, { button: 0, clientX: 300, clientY: 230 });
    change("X (cm)", "50");
    change("Z (cm)", "50");
    change("Width (cm)", "180");
    change("Depth (cm)", "60");
    fireEvent.click(screen.getByRole("checkbox", { name: "Lock after applying" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));

    expect(screen.getByRole("button", { name: "Unlock" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Remove/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Unlock" }));
    expect(screen.getByRole("button", { name: /Remove/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Unavailable zone" }));
    expect(screen.getByRole("button", { name: /Physical obstacle, physical obstacle/ })).toHaveProperty("tabIndex", -1);
    fireEvent.pointerDown(plan, { button: 0, clientX: 330, clientY: 240 });

    expect(container.textContent).toContain("conflict with an unavailable zone");
    expect(screen.getByRole("button", { name: /Physical obstacle, physical obstacle/ })).toHaveProperty("tabIndex", 0);
    expect(screen.queryByRole("button", { name: "Add to room" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Undo/ }));
    expect(container.textContent).not.toContain("conflict with an unavailable zone");
    fireEvent.click(screen.getByRole("button", { name: /Redo/ }));
    expect(container.textContent).toContain("conflict with an unavailable zone");
  });

  it("adds simple wall elements without creating unavailable zones", () => {
    const wallIds = ["wall-element_door", "wall-element_window"];
    render(<CreatorEditor dependencies={{
      generateObstacleId: () => "obstacle_fallback",
      generateWallElementId: () => wallIds.shift() ?? "wall-element_fallback",
    }} initialProject={createDefaultProject()} />);
    const plan = screen.getByRole("group", { name: "Top-down editable room plan" });
    Object.defineProperty(plan, "getBoundingClientRect", { value: () => ({
      bottom: 560, height: 560, left: 0, right: 760, top: 0, width: 760,
      x: 0, y: 0, toJSON: () => undefined,
    }) });

    fireEvent.click(screen.getByRole("button", { name: "Door" }));
    fireEvent.pointerDown(plan, { button: 0, clientX: 250, clientY: 48 });
    expect(screen.getByRole("button", { name: /Door, door, top wall/ })).toBeTruthy();
    expect(screen.getByText("Wall elements do not create an unavailable zone.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Window" }));
    fireEvent.pointerDown(plan, { button: 0, clientX: 500, clientY: 48 });
    expect(screen.getByRole("button", { name: /Window, window, top wall/ })).toBeTruthy();
    expect(screen.getByText("No obstacles or unavailable zones yet.")).toBeTruthy();
  });

  it("rejects invalid form values without creating history", () => {
    render(<CreatorEditor initialProject={createDefaultProject()} />);
    change("Width (cm)", "0");
    fireEvent.click(screen.getByRole("button", { name: "Apply room" }));
    expect(screen.getByRole("alert").textContent).toContain("positive whole centimeters");
    expect(screen.getByRole("button", { name: /Undo/ })).toHaveProperty("disabled", true);
  });

  it("places, rotates, removes, and restores catalog equipment", () => {
    render(<CreatorEditor dependencies={{
      generatePlacementId: () => "placement_northstar",
    }} initialProject={createDefaultProject()} />);
    const plan = screen.getByRole("group", { name: "Top-down editable room plan" });
    Object.defineProperty(plan, "getBoundingClientRect", { value: () => ({
      bottom: 560, height: 560, left: 0, right: 760, top: 0, width: 760,
      x: 0, y: 0, toJSON: () => undefined,
    }) });

    fireEvent.click(screen.getByRole("button", { name: "Place Northstar Half Rack" }));
    fireEvent.pointerDown(plan, { button: 0, clientX: 300, clientY: 230 });

    expect(screen.getByRole("heading", { name: "Selected equipment" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Northstar Half Rack, equipment/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Rotate 90°" }));
    expect(screen.getByRole("button", { name: /Northstar Half Rack, equipment, 90 degrees/ })).toBeTruthy();

    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Remove from project" }));
    expect(screen.queryByRole("button", { name: /Northstar Half Rack, equipment/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Undo/ }));
    expect(screen.getByRole("button", { name: /Northstar Half Rack, equipment, 90 degrees/ })).toBeTruthy();
  });
});
