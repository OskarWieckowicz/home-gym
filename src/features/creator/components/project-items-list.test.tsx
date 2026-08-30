// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createDefaultProject } from "@/features/project/defaults";
import { toProjectItemsAndPlacements } from "@/features/project/validation/test-placed-equipment";

import { ProjectStoreProvider } from "../store/project-store-context";
import { ProjectItemsList } from "./project-items-list";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const listProps = {
  activeProjectItemId: null,
  selectedId: null,
  onSelect: vi.fn(),
  onPlaceItem: vi.fn(),
};

describe("ProjectItemsList", () => {
  it("lets an unplaced floor product be placed later and keeps selection-only items unplaceable", () => {
    const onPlaceItem = vi.fn();
    render(
      <ProjectStoreProvider
        initialProject={{
          ...createDefaultProject(),
          projectItems: [
            { id: "project-item_barbell", productId: "product_quarry_power_bar" },
            { id: "project-item_wraps", productId: "product_cove_wrist_wraps" },
          ],
        }}
      >
        <ProjectItemsList {...listProps} onPlaceItem={onPlaceItem} />
      </ProjectStoreProvider>,
    );

    expect(screen.getAllByText("Unplaced")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Place Quarry Power Bar" }));
    expect(onPlaceItem).toHaveBeenCalledWith("project-item_barbell");
    expect(screen.queryByRole("button", { name: "Place Cove Wrist Wraps" })).toBeNull();
    expect(screen.getByRole("button", { name: /Cove Wrist WrapsUnplaced/ })).toBeTruthy();
  });

  it("unplaces without removing and then removes the unplaced item without a cascade prompt", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { projectItems, placements } = toProjectItemsAndPlacements([{
      id: "placement_bench",
      productId: "product_arc_adjustable_bench",
      position: { xCm: 80, zCm: 80 },
      rotation: 0,
    }]);

    render(
      <ProjectStoreProvider
        initialProject={{
          ...createDefaultProject(),
          projectItems,
          placements,
        }}
      >
        <ProjectItemsList {...listProps} />
      </ProjectStoreProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Unplace Arc Adjustable Bench" }));
    expect(confirm).not.toHaveBeenCalled();
    expect(screen.getByText("Unplaced")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Place Arc Adjustable Bench" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Remove Arc Adjustable Bench from project" }));
    expect(confirm).not.toHaveBeenCalled();
    expect(screen.getByText("No equipment in the project yet.")).toBeTruthy();
  });

  it("asks for confirmation before cascading a placed-item removal", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { projectItems, placements } = toProjectItemsAndPlacements([{
      id: "placement_bench",
      productId: "product_arc_adjustable_bench",
      position: { xCm: 80, zCm: 80 },
      rotation: 0,
    }]);

    render(
      <ProjectStoreProvider
        initialProject={{
          ...createDefaultProject(),
          projectItems,
          placements,
        }}
      >
        <ProjectItemsList {...listProps} />
      </ProjectStoreProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove Arc Adjustable Bench from project" }));
    expect(confirm).toHaveBeenCalledWith(
      "Removing Arc Adjustable Bench will also remove it from the floor plan.",
    );
    expect(screen.getByRole("button", { name: /Arc Adjustable BenchPlaced/ })).toBeTruthy();
  });
});
