// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createDefaultProject } from "@/features/project/defaults";
import type { GymProject } from "@/features/project/schemas/project";

import { ProjectStoreProvider } from "../store/project-store-context";
import { ElementPanel } from "./element-panel";

afterEach(cleanup);

const panelProps = {
  activePanel: "room" as const,
  activeProductId: null,
  activeTool: null,
  onPanelChange: vi.fn(),
  onProductActivate: vi.fn(),
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
    placements: [{
      id: "placement_item",
      productId,
      position: { xCm: 100, zCm: 100 },
      rotation: 90,
    }],
  };
}

function placedEquipmentButton(name: string) {
  return screen.getByRole("button", { name: new RegExp(`${name}Equipment`) });
}

describe("ElementPanel placed equipment", () => {
  it("shows the catalog photo for mapped products", () => {
    renderPanel(projectWithPlacement("product_harbor_squat_stands"));

    expect(
      decodeURIComponent(placedEquipmentButton("Harbor Squat Stands").querySelector("img")?.getAttribute("src") ?? ""),
    ).toContain("/assets/harbor-squat-stands-catalog.png");
  });

  it("keeps the icon fallback when a product has no thumbnail", () => {
    renderPanel(projectWithPlacement("product_northstar_half_rack"));

    expect(placedEquipmentButton("Northstar Half Rack").querySelector("img")).toBeNull();
  });
});
