// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { createDefaultProject } from "@/features/project/defaults";
import type { GymProject } from "@/features/project/schemas/project";
import { toProjectItemsAndPlacements } from "@/features/project/validation/test-placed-equipment";

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
      ...toProjectItemsAndPlacements([
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
      ]),
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

  it("describes wall-mount errors in the same sentence style as the ceiling rule", () => {
    renderSummary({
      ...createDefaultProject(),
      room: { widthCm: 300, depthCm: 400, heightCm: 250 },
      wallElements: [{
        id: "wall-element_door",
        kind: "door",
        name: "Door",
        wall: "top",
        offsetCm: 20,
        widthCm: 90,
      }],
      ...toProjectItemsAndPlacements([{
        id: "placement_bar",
        productId: "product_anchor_pullup_bar",
        position: { xCm: 200, zCm: 80 },
        rotation: 90,
      }]),
    });

    expect(screen.getByText(
      "Anchor Pull-Up Bar must sit flush on the right wall; it is 46 cm away.",
    )).toBeTruthy();
  });

  it("names the opening a wall mount crosses", () => {
    renderSummary({
      ...createDefaultProject(),
      room: { widthCm: 300, depthCm: 400, heightCm: 250 },
      wallElements: [
        {
          id: "wall-element_door",
          kind: "door",
          name: "Door",
          wall: "top",
          offsetCm: 20,
          widthCm: 90,
        },
        {
          id: "wall-element_window",
          kind: "window",
          name: "Window",
          wall: "right",
          offsetCm: 80,
          widthCm: 120,
        },
      ],
      ...toProjectItemsAndPlacements([{
        id: "placement_bar",
        productId: "product_anchor_pullup_bar",
        position: { xCm: 246, zCm: 40 },
        rotation: 90,
      }]),
    });

    expect(screen.getByText(
      "Anchor Pull-Up Bar overlaps Window on the right wall.",
    )).toBeTruthy();
  });
});
