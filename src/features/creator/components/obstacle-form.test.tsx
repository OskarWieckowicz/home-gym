// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createDefaultProject } from "@/features/project/defaults";
import type { PhysicalObstacle } from "@/features/project/schemas/project";

import { ProjectStoreProvider, useProjectStore } from "../store/project-store-context";
import { ObstacleForm } from "./obstacle-form";

const wardrobe: PhysicalObstacle = {
  id: "obstacle_wardrobe",
  kind: "obstacle",
  name: "Wardrobe",
  position: { xCm: 20, zCm: 30 },
  dimensions: { widthCm: 100, depthCm: 50, heightCm: 200 },
  functionalClearance: { frontCm: 60, backCm: 0, leftCm: 10, rightCm: 20 },
  rotation: 90,
  locked: false,
};

function ClearanceProbe() {
  const state = useProjectStore((value) => value);
  const obstacle = state.project.obstacles[0];
  if (!obstacle || obstacle.kind !== "obstacle") return null;
  return (
    <output aria-label="Clearance state">
      {state.revision}:{obstacle.functionalClearance.frontCm}:
      {obstacle.functionalClearance.backCm}:{obstacle.functionalClearance.leftCm}:
      {obstacle.functionalClearance.rightCm}:{String(state.canUndo)}
    </output>
  );
}

afterEach(cleanup);

describe("ObstacleForm functional clearance", () => {
  it("edits all directional margins in one shared undoable command", () => {
    render(
      <ProjectStoreProvider initialProject={{
        ...createDefaultProject(),
        obstacles: [wardrobe],
      }}>
        <ClearanceProbe />
        <ObstacleForm obstacle={wardrobe} onRemoved={vi.fn()} />
      </ProjectStoreProvider>,
    );

    expect(screen.getByText("Space needed to use this furniture")).toBeTruthy();
    expect(screen.getByText(/relative to the furniture’s current front/i)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Front (cm)"), { target: { value: "70" } });
    fireEvent.change(screen.getByLabelText("Back (cm)"), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText("Left (cm)"), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText("Right (cm)"), { target: { value: "25" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));

    expect(screen.getByLabelText("Clearance state").textContent).toBe("1:70:5:0:25:true");
  });

  it("does not show furniture clearance fields for unavailable zones", () => {
    const zone = {
      id: "obstacle_zone",
      kind: "unavailable-zone" as const,
      name: "No storage",
      position: { xCm: 20, zCm: 30 },
      dimensions: { widthCm: 100, depthCm: 50 },
      rotation: 0 as const,
      locked: false,
    };
    render(
      <ProjectStoreProvider initialProject={{ ...createDefaultProject(), obstacles: [zone] }}>
        <ObstacleForm obstacle={zone} onRemoved={vi.fn()} />
      </ProjectStoreProvider>,
    );

    expect(screen.queryByText("Space needed to use this furniture")).toBeNull();
  });
});
