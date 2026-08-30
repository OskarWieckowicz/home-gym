// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createDefaultProject } from "@/features/project/defaults";
import type { GymProject } from "@/features/project/schemas/project";
import { toProjectItemsAndPlacements } from "@/features/project/validation/test-placed-equipment";

import { ProjectStoreProvider } from "../store/project-store-context";
import { ElementPanel } from "./element-panel";

afterEach(cleanup);

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
  return screen.getByRole("button", { name: new RegExp(`${name}Placed`) });
}

describe("ElementPanel project equipment", () => {
  it.each([
    ["product_harbor_squat_stands", "Harbor Squat Stands", "/assets/harbor-squat-stands-catalog.png"],
    ["product_northstar_half_rack", "Northstar Half Rack", "/assets/northstar-half-rack-catalog.png"],
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
