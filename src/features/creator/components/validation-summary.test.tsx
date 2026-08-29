// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { createDefaultProject } from "@/features/project/defaults";
import type { GymProject } from "@/features/project/schemas/project";

import { ProjectStoreProvider } from "../store/project-store-context";
import { ValidationSummary } from "./validation-summary";

afterEach(cleanup);

function renderSummary(project: GymProject) {
  return render(
    <ProjectStoreProvider initialProject={project}>
      <ValidationSummary />
    </ProjectStoreProvider>,
  );
}

describe("ValidationSummary", () => {
  it("reports a clean layout only when there are no issues", () => {
    renderSummary({
      ...createDefaultProject(),
      wallElements: [{
        id: "wall-element_door",
        kind: "door",
        name: "Door",
        wall: "top",
        offsetCm: 40,
        widthCm: 90,
      }],
    });
    expect(screen.getByText("No layout conflicts found.")).toBeTruthy();
  });

  it("states the no-door case as missing input rather than a layout warning", () => {
    renderSummary(createDefaultProject());
    expect(screen.getByText(/Access cannot be evaluated until the room has a door/)).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Warnings" })).toBeNull();
    expect(screen.queryByText("No layout conflicts found.")).toBeNull();
  });

  it("separates warnings from a valid layout", () => {
    renderSummary({
      ...createDefaultProject(),
      room: { widthCm: 600, depthCm: 600, heightCm: 250 },
      budget: 20_000,
      wallElements: [{
        id: "wall-element_door",
        kind: "door",
        name: "Door",
        wall: "bottom",
        offsetCm: 250,
        widthCm: 90,
      }],
      placements: [
        {
          id: "placement_cage",
          productId: "product_summit_power_cage",
          position: { xCm: 80, zCm: 40 },
          rotation: 0,
        },
        {
          id: "placement_bench",
          productId: "product_arc_adjustable_bench",
          position: { xCm: 112, zCm: 206 },
          rotation: 0,
        },
      ],
    });

    expect(screen.queryByText("No layout conflicts found.")).toBeNull();
    expect(screen.getByText("No errors, 1 warning")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Warnings" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Errors" })).toBeNull();
    expect(screen.getByText(/share a use zone/)).toBeTruthy();
  });

  it("keeps errors visually and in copy distinct from warnings", () => {
    renderSummary({
      ...createDefaultProject(),
      obstacles: [{
        id: "obstacle_outside",
        kind: "obstacle",
        name: "Wardrobe",
        position: { xCm: 390, zCm: 0 },
        dimensions: { widthCm: 180, depthCm: 60, heightCm: 220 },
        rotation: 0,
        locked: false,
      }],
    });

    expect(screen.getByText("1 error, 1 warning")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Errors" })).toBeTruthy();
    expect(screen.getByText(/is outside the room/)).toBeTruthy();
  });
});
