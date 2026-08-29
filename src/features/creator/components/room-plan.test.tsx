// @vitest-environment jsdom

import { cleanup, createEvent, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDefaultProject } from "@/features/project/defaults";
import type { GymProject } from "@/features/project/schemas/project";

import { ProjectStoreProvider, useProjectStore } from "../store/project-store-context";
import type { PlacementTool } from "../editor-types";
import { EQUIPMENT_DRAG_TYPE } from "./equipment-catalog-panel";
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

function projectWithObstacle(locked = false, name: string = obstacle.name): GymProject {
  return {
    ...createDefaultProject(),
    obstacles: [{ ...obstacle, locked, name }],
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

function EquipmentStoreProbe() {
  const state = useProjectStore((value) => value);
  const current = state.project.placements[0];
  return (
    <output aria-label="Equipment store state">
      {state.revision}:{current?.position.xCm}:{current?.position.zCm}:{String(state.canUndo)}
    </output>
  );
}

function renderPlan(locked = false, name: string = obstacle.name) {
  render(
    <ProjectStoreProvider initialProject={projectWithObstacle(locked, name)}>
      <StoreProbe />
      <RoomPlan
        activeProductId={null}
        activeTool={null}
        onCancelPlacement={vi.fn()}
        onPlacementComplete={vi.fn()}
        onPlacementError={vi.fn()}
        onSelect={vi.fn()}
        placementError=""
        selectedId={null}
      />
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
  return screen.getByRole("button", { name: `${name}, physical obstacle${locked ? ", locked" : ""}` });
}

function PlacementProbe() {
  const state = useProjectStore((value) => value);
  return (
    <output aria-label="Placement state">
      {`${state.revision}:${state.project.obstacles.length}:${state.project.wallElements.length}:${state.project.placements.length}`}
    </output>
  );
}

function renderPlacement(tool: PlacementTool, bounds = {
  bottom: 560,
  height: 560,
  left: 0,
  right: 760,
  top: 0,
  width: 760,
  x: 0,
  y: 0,
  toJSON: () => undefined,
}) {
  const onPlacementComplete = vi.fn();
  render(
    <ProjectStoreProvider dependencies={{
      generateObstacleId: () => "obstacle_placed",
      generateWallElementId: () => "wall-element_placed",
    }} initialProject={createDefaultProject()}>
      <PlacementProbe />
      <RoomPlan
        activeProductId={null}
        activeTool={tool}
        onCancelPlacement={vi.fn()}
        onPlacementComplete={onPlacementComplete}
        onPlacementError={vi.fn()}
        onSelect={vi.fn()}
        placementError=""
        selectedId={null}
      />
    </ProjectStoreProvider>,
  );
  const plan = screen.getByRole("group", { name: "Top-down editable room plan" });
  vi.spyOn(plan, "getBoundingClientRect").mockReturnValue(bounds);
  return { plan, onPlacementComplete };
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
  it("keeps long labels inside the footprint and uses a lock icon", () => {
    const longName = "Wardrobe with a name too long for its footprint";
    const entity = renderPlan(true, longName);
    const label = entity.querySelector(".creator-entity-label");
    const labelContainer = entity.querySelector(".creator-entity-label-container");

    expect(label?.textContent).toBe(longName);
    expect(label?.getAttribute("title")).toBe(longName);
    expect(Number(labelContainer?.getAttribute("width"))).toBeLessThan(120);
    expect(entity.querySelector(".creator-entity-lock")).toBeTruthy();
    expect(entity.querySelector(".creator-entity-mark")?.textContent).not.toBe("L");
  });

  it("keeps adjacent wall-element labels available for hover and keyboard focus", () => {
    const names = [
      "Przeszklenie tarasowe — lewy segment (szac.)",
      "Drzwi tarasowe — środkowy segment (szac.)",
      "Przeszklenie tarasowe — prawy segment (szac.)",
    ];
    const project: GymProject = {
      ...createDefaultProject(),
      room: { widthCm: 600, depthCm: 700, heightCm: 250 },
      wallElements: names.map((name, index) => ({
        id: `wall-element_${index}`,
        kind: index === 1 ? "door" : "window",
        name,
        wall: "top",
        offsetCm: 135 + index * 110,
        widthCm: 110,
      })),
    };
    render(
      <ProjectStoreProvider initialProject={project}>
        <RoomPlan
          activeProductId={null}
          activeTool={null}
          onCancelPlacement={vi.fn()}
          onPlacementComplete={vi.fn()}
          onPlacementError={vi.fn()}
          onSelect={vi.fn()}
          placementError=""
          selectedId={null}
        />
      </ProjectStoreProvider>,
    );
    const labels = Array.from(document.querySelectorAll<SVGTextElement>(
      ".creator-wall-element-label",
    ));

    expect(labels).toHaveLength(3);
    expect(labels.map((label) => label.textContent)).toEqual(names);
    expect(new Set(labels.map((label) => label.getAttribute("x"))).size).toBe(3);
    expect(labels.every((label) => label.getAttribute("aria-hidden") === "true")).toBe(true);
    expect(Array.from(document.querySelectorAll(".creator-plan-wall-element title"))
      .map((title) => title.textContent)).toEqual(names);
  });

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

  it("renders equipment use zones and commits equipment drag once", () => {
    const project: GymProject = {
      ...createDefaultProject(),
      placements: [{
        id: "placement_rack",
        productId: "product_northstar_half_rack",
        position: { xCm: 20, zCm: 30 },
        rotation: 0,
      }],
    };
    render(
      <ProjectStoreProvider initialProject={project}>
        <EquipmentStoreProbe />
        <RoomPlan
          activeProductId={null}
          activeTool={null}
          onCancelPlacement={vi.fn()}
          onPlacementComplete={vi.fn()}
          onPlacementError={vi.fn()}
          onSelect={vi.fn()}
          placementError=""
          selectedId={null}
        />
      </ProjectStoreProvider>,
    );
    const entity = screen.getByRole("button", { name: /Northstar Half Rack, equipment/ });
    const plan = screen.getByRole("group", { name: "Top-down editable room plan" });
    vi.spyOn(plan, "getBoundingClientRect").mockReturnValue({
      bottom: 560, height: 560, left: 0, right: 760, top: 0, width: 760,
      x: 0, y: 0, toJSON: () => undefined,
    });

    expect(entity.querySelector(".creator-equipment-use-zone")).toBeTruthy();
    expect(entity.querySelector(".creator-equipment-footprint")).toBeTruthy();
    fireEvent.pointerDown(entity, { button: 0, clientX: 100, clientY: 100, pointerId: 8 });
    fireEvent.pointerMove(entity, { clientX: 115, clientY: 115, pointerId: 8 });
    fireEvent.pointerMove(entity, { clientX: 129, clientY: 129, pointerId: 8 });
    fireEvent.pointerUp(entity, { clientX: 129, clientY: 129, pointerId: 8 });

    expect(screen.getByRole("status", { name: "Equipment store state" }).textContent)
      .toBe("1:40:50:true");
  });
});

describe("RoomPlan placement", () => {
  it("places a floor area directly from the active tool", () => {
    const { plan, onPlacementComplete } = renderPlacement("unavailable-zone");
    fireEvent.pointerDown(plan, { button: 0, clientX: 380, clientY: 280 });

    expect(screen.getByRole("status", { name: "Placement state" }).textContent).toBe("1:1:0:0");
    expect(onPlacementComplete).toHaveBeenCalledWith("obstacle_placed");
    expect(screen.getByRole("button", { name: /Unavailable zone, unavailable zone/ })).toBeTruthy();
  });

  it("places a door on a wall without adding an unavailable zone", () => {
    const { plan, onPlacementComplete } = renderPlacement("door");
    fireEvent.pointerDown(plan, { button: 0, clientX: 380, clientY: 48 });

    expect(screen.getByRole("status", { name: "Placement state" }).textContent).toBe("1:0:1:0");
    expect(onPlacementComplete).toHaveBeenCalledWith("wall-element_placed");
    expect(screen.getByRole("button", { name: /Door, door, top wall/ })).toBeTruthy();
  });

  it("places wall elements on a side wall in a letterboxed SVG", () => {
    const bounds = {
      bottom: 667,
      height: 417,
      left: 298,
      right: 919,
      top: 250,
      width: 621,
      x: 298,
      y: 250,
      toJSON: () => undefined,
    };
    const scale = bounds.height / 560;
    const horizontalInset = (bounds.width - 760 * scale) / 2;
    const { plan } = renderPlacement("window", bounds);
    fireEvent.pointerDown(plan, {
      button: 0,
      clientX: bounds.left + horizontalInset + 667.5 * scale,
      clientY: bounds.top + 280 * scale,
    });

    expect(screen.getByRole("button", { name: /Window, window, right wall/ })).toBeTruthy();
  });

  it("places catalog equipment from a drag-and-drop payload", () => {
    const onPlacementComplete = vi.fn();
    render(
      <ProjectStoreProvider dependencies={{
        generatePlacementId: () => "placement_dropped",
      }} initialProject={createDefaultProject()}>
        <PlacementProbe />
        <RoomPlan
          activeProductId={null}
          activeTool={null}
          onCancelPlacement={vi.fn()}
          onPlacementComplete={onPlacementComplete}
          onPlacementError={vi.fn()}
          onSelect={vi.fn()}
          placementError=""
          selectedId={null}
        />
      </ProjectStoreProvider>,
    );
    const plan = screen.getByRole("group", { name: "Top-down editable room plan" });
    vi.spyOn(plan, "getBoundingClientRect").mockReturnValue({
      bottom: 560, height: 560, left: 0, right: 760, top: 0, width: 760,
      x: 0, y: 0, toJSON: () => undefined,
    });
    const dataTransfer = {
      dropEffect: "none",
      types: [EQUIPMENT_DRAG_TYPE],
      getData: vi.fn(() => "product_northstar_half_rack"),
    };

    fireEvent.dragOver(plan, { dataTransfer });
    const drop = createEvent.drop(plan, { dataTransfer });
    Object.defineProperties(drop, {
      clientX: { value: 380 },
      clientY: { value: 280 },
    });
    fireEvent(plan, drop);

    expect(screen.getByRole("status", { name: "Placement state" }).textContent)
      .toBe("1:0:0:1");
    expect(onPlacementComplete).toHaveBeenCalledWith("placement_dropped");
  });
});
