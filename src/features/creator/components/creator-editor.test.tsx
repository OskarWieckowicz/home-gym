// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { createDefaultProject } from "@/features/project/defaults";

import { CreatorEditor } from "./creator-editor";

afterEach(cleanup);

function change(name: string, value: string) {
  fireEvent.change(screen.getByRole("spinbutton", { name }), { target: { value } });
}

describe("CreatorEditor", () => {
  it("uses shared commands for exact forms, locking, validation, undo and redo", () => {
    const ids = ["obstacle_wardrobe", "obstacle_door"];
    const { container } = render(<CreatorEditor dependencies={{ generateObstacleId: () => ids.shift() ?? "obstacle_fallback" }} initialProject={createDefaultProject()} />);

    fireEvent.click(screen.getByRole("button", { name: "Project settings" }));
    change("Budget", "12500");
    fireEvent.click(screen.getByRole("checkbox", { name: "Strength" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply settings" }));
    expect(screen.getByRole("button", { name: /Undo/ })).not.toHaveProperty("disabled", true);

    fireEvent.click(screen.getByRole("button", { name: "Add an area" }));
    change("X (cm)", "0");
    change("Z (cm)", "0");
    change("Width (cm)", "180");
    change("Depth (cm)", "60");
    fireEvent.click(screen.getByRole("checkbox", { name: "Lock after applying" }));
    fireEvent.click(screen.getByRole("button", { name: "Add to room" }));

    expect(screen.getByRole("button", { name: "Unlock" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Remove/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Unlock" }));
    expect(screen.getByRole("button", { name: /Remove/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Add an area" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Type" }), { target: { value: "unavailable-zone" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), { target: { value: "Door swing" } });
    change("X (cm)", "50");
    change("Z (cm)", "20");
    change("Width (cm)", "100");
    change("Depth (cm)", "100");
    fireEvent.click(screen.getByRole("button", { name: "Add to room" }));

    expect(container.textContent).toContain("conflict with an unavailable zone");

    fireEvent.click(screen.getByRole("button", { name: /Undo/ }));
    expect(container.textContent).not.toContain("conflict with an unavailable zone");
    fireEvent.click(screen.getByRole("button", { name: /Redo/ }));
    expect(container.textContent).toContain("conflict with an unavailable zone");
  });

  it("rejects invalid form values without creating history", () => {
    render(<CreatorEditor />);
    change("Width (cm)", "0");
    fireEvent.click(screen.getByRole("button", { name: "Apply room" }));
    expect(screen.getByRole("alert").textContent).toContain("positive whole centimeters");
    expect(screen.getByRole("button", { name: /Undo/ })).toHaveProperty("disabled", true);
  });
});
