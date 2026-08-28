// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDefaultProject } from "@/features/project/defaults";
import type { GymProject } from "@/features/project/schemas/project";

import { ProjectStoreProvider, useProjectStore } from "../store/project-store-context";
import { RoomPlan } from "./room-plan";

const obstacle = {
  id: "obstacle_wardrobe",
  kind: "obstacle",
  name: "Wardrobe",
  position: { xCm: 20, zCm: 30 },
  dimensions: { widthCm: 100, depthCm: 50, heightCm: 200 },
  rotation: 0,
  locked: false,
} as const;

function projectWithObstacle(locked = false): GymProject {
  return {
    ...createDefaultProject(),
    obstacles: [{ ...obstacle, locked }],
  };
}

function StoreProbe() {
  const state = useProjectStore((value) => value);
  const current = state.project.obstacles[0];
  return (
    <output aria-label="Store state">
      {state.revision}:{current?.position.xCm}:{current?.position.zCm}:{String(state.canUndo)}
    </output>
  );
}

function renderPlan(locked = false) {
  render(
    <ProjectStoreProvider initialProject={projectWithObstacle(locked)}>
      <StoreProbe />
      <RoomPlan onSelect={vi.fn()} selectedId={null} />
    </ProjectStoreProvider>,
  );
  const plan = screen.getByRole("group", { name: "Top-down editable room plan" });
  vi.spyOn(plan, "getBoundingClientRect").mockReturnValue({
    bottom: 560,
    height: 560,
    left: 0,
    right: 760,
    top: 0,
    width: 760,
    x: 0,
    y: 0,
    toJSON: () => undefined,
  });
  return screen.getByRole("button", { name: /Wardrobe, physical obstacle/ });
}

beforeEach(() => {
  Object.defineProperty(SVGElement.prototype, "setPointerCapture", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("RoomPlan dragging", () => {
  it("commits many pointer moves as one store revision", () => {
    const entity = renderPlan();
    fireEvent.pointerDown(entity, { button: 0, clientX: 100, clientY: 100, pointerId: 7 });
    fireEvent.pointerMove(entity, { clientX: 115, clientY: 115, pointerId: 7 });
    fireEvent.pointerMove(entity, { clientX: 129, clientY: 129, pointerId: 7 });
    fireEvent.pointerUp(entity, { clientX: 129, clientY: 129, pointerId: 7 });
    expect(screen.getByRole("status", { name: "Store state" }).textContent).toBe("1:40:50:true");
  });

  it("does not mutate for cancel, no-op, or a locked entity", () => {
    const entity = renderPlan();
    fireEvent.pointerDown(entity, { button: 0, clientX: 100, clientY: 100, pointerId: 3 });
    fireEvent.pointerMove(entity, { clientX: 129, clientY: 129, pointerId: 3 });
    fireEvent.pointerCancel(entity, { pointerId: 3 });
    expect(screen.getByRole("status", { name: "Store state" }).textContent).toBe("0:20:30:false");

    fireEvent.pointerDown(entity, { button: 0, clientX: 100, clientY: 100, pointerId: 4 });
    fireEvent.pointerUp(entity, { clientX: 100, clientY: 100, pointerId: 4 });
    expect(screen.getByRole("status", { name: "Store state" }).textContent).toBe("0:20:30:false");

    cleanup();
    const lockedEntity = renderPlan(true);
    fireEvent.pointerDown(lockedEntity, { button: 0, clientX: 100, clientY: 100, pointerId: 5 });
    fireEvent.pointerMove(lockedEntity, { clientX: 129, clientY: 129, pointerId: 5 });
    fireEvent.pointerUp(lockedEntity, { clientX: 129, clientY: 129, pointerId: 5 });
    expect(screen.getByRole("status", { name: "Store state" }).textContent).toBe("0:20:30:false");
  });
});
