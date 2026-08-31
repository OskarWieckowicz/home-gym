// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createDefaultProject } from "@/features/project/defaults";
import type { GymProject } from "@/features/project/schemas/project";
import { toProjectItemsAndPlacements } from "@/features/project/validation/test-placed-equipment";

import { ProjectStoreProvider } from "../store/project-store-context";
import { ElementPanel } from "./element-panel";

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const panelProps = {
  activePanel: "room" as const,
  activeProductId: null,
  activeProjectItemId: null,
  activeTool: null,
  onPanelChange: vi.fn(),
  onPlaceItem: vi.fn(),
  onProductActivate: vi.fn(),
  onProductAdd: vi.fn(),
  onToolChange: vi.fn(),
  selectedId: null,
  onSelect: vi.fn(),
  onCancelPlacement: vi.fn(),
};

function renderPanel(project: GymProject) {
  return render(
    <ProjectStoreProvider initialProject={project}>
      <ElementPanel {...panelProps} />
    </ProjectStoreProvider>,
  );
}

function projectWithPlacement(productId: string): GymProject {
  return {
    ...createDefaultProject(),
    ...toProjectItemsAndPlacements([{
      id: "placement_item",
      productId,
      position: { xCm: 100, zCm: 100 },
      rotation: 90,
    }]),
  };
}

function placedEquipmentButton(name: string) {
  fireEvent.click(screen.getByRole("tab", { name: "Project items" }));
  return screen.getByRole("button", { name: new RegExp(`${name}Placed`) });
}

describe("ElementPanel workspace tabs", () => {
  it("defaults to Equipment and keeps inactive panels out of the accessibility tree", () => {
    renderPanel(createDefaultProject());
    expect(screen.getByRole("tab", { name: "Equipment" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
    expect(screen.getAllByRole("tabpanel", { hidden: true })).toHaveLength(3);
    expect(screen.queryByRole("button", { name: "Physical obstacle" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Room dimensions" })).toBeNull();
  });

  it("supports roving focus, arrow wrap, Home and End with matching panel relationships", () => {
    renderPanel(createDefaultProject());
    const equipment = screen.getByRole("tab", { name: "Equipment" });
    const room = screen.getByRole("tab", { name: "Room" });
    const items = screen.getByRole("tab", { name: "Project items" });
    equipment.focus();
    fireEvent.keyDown(equipment, { key: "ArrowRight" });
    expect(document.activeElement).toBe(room);
    expect(room.tabIndex).toBe(0);
    expect(equipment.tabIndex).toBe(-1);
    expect(screen.getByRole("tabpanel").id).toBe(room.getAttribute("aria-controls"));
    expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe(room.id);
    fireEvent.keyDown(room, { key: "End" });
    expect(document.activeElement).toBe(items);
    fireEvent.keyDown(items, { key: "ArrowRight" });
    expect(document.activeElement).toBe(equipment);
    fireEvent.keyDown(equipment, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(items);
    fireEvent.keyDown(items, { key: "Home" });
    expect(document.activeElement).toBe(equipment);
  });

  it("cancels placement on changed tabs without changing the selected entity or inspector", () => {
    renderPanel(createDefaultProject());
    fireEvent.click(screen.getByRole("tab", { name: "Equipment" }));
    expect(panelProps.onCancelPlacement).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("tab", { name: "Room" }));
    expect(panelProps.onCancelPlacement).toHaveBeenCalledTimes(1);
    expect(panelProps.onSelect).not.toHaveBeenCalled();
    expect(panelProps.onPanelChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Room dimensions" }));
    expect(panelProps.onPanelChange).toHaveBeenCalledWith("room");
    fireEvent.click(screen.getByRole("button", { name: "Physical obstacle" }));
    expect(panelProps.onToolChange).toHaveBeenCalledWith("obstacle");
  });

  it("preserves the mounted catalog search and category when switching tabs", () => {
    renderPanel(createDefaultProject());
    const search = screen.getByRole("searchbox", { name: "Search equipment" });
    fireEvent.change(search, { target: { value: "pivot" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Equipment category" }), { target: { value: "benches" } });
    fireEvent.click(screen.getByRole("tab", { name: "Room" }));
    expect(screen.queryByRole("searchbox")).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Equipment" }));
    expect(screen.getByRole("searchbox")).toBe(search);
    expect((search as HTMLInputElement).value).toBe("pivot");
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("benches");
    expect(screen.getByRole("button", { name: "Place Pivot Flat Bench" })).toBeTruthy();
  });
});

describe("ElementPanel project equipment", () => {
  it.each([
    ["product_harbor_squat_stands", "Harbor Squat Stands", "/assets/harbor-squat-stands-catalog.png"],
    ["product_northstar_half_rack", "Northstar Half Rack", "/assets/northstar-half-rack-catalog-v4.png"],
    ["product_pivot_flat_bench", "Pivot Flat Bench", "/assets/pivot-flat-bench-catalog.png"],
    ["product_range_adjustable_dumbbells", "Range Adjustable Dumbbells", "/assets/range-adjustable-dumbbells-catalog.png"],
    ["product_surge_compact_treadmill", "Surge Compact Treadmill", "/assets/surge-compact-treadmill-catalog.png"],
    ["product_summit_strength_station", "Summit Complete Strength Station", "/assets/summit-strength-station-catalog.png"],
  ])("shows the catalog photo for %s", (productId, name, imagePath) => {
    renderPanel(projectWithPlacement(productId));

    expect(
      decodeURIComponent(placedEquipmentButton(name).querySelector("img")?.getAttribute("src") ?? ""),
    ).toContain(imagePath);
  });

  it("keeps the icon fallback when a product has no thumbnail", () => {
    renderPanel(projectWithPlacement("product_cove_folding_bench"));

    expect(placedEquipmentButton("Cove Folding Bench").querySelector("img")).toBeNull();
  });
});
