import { describe, expect, it } from "vitest";

import type {
  GymProject,
  Obstacle,
  PhysicalObstacle,
  Placement,
  UnavailableZone,
  WallElement,
} from "../schemas/project";
import type { ProductValidationDescriptor } from "./product-validation";
import { analyzeProject, validateProject } from "./validate-project";

const rack: ProductValidationDescriptor = {
  id: "product_rack",
  price: 2_000,
  dimensions: { widthCm: 80, depthCm: 70, heightCm: 220 },
  useZone: { frontCm: 80, backCm: 10, leftCm: 20, rightCm: 20 },
  minimumCeilingHeightCm: 230,
};

const plates: ProductValidationDescriptor = {
  id: "product_plates",
  price: 500,
  dimensions: { widthCm: 50, depthCm: 50, heightCm: 40 },
  useZone: { frontCm: 0, backCm: 0, leftCm: 0, rightCm: 0 },
};

const dependencies = {
  resolveProduct: (productId: string) =>
    productId === rack.id ? rack : productId === plates.id ? plates : undefined,
};

function door(
  id: string,
  wall: WallElement["wall"],
  offsetCm: number,
  widthCm = 90,
): WallElement {
  return { id, kind: "door", name: id, wall, offsetCm, widthCm };
}

function obstacle(
  id: string,
  overrides: Partial<PhysicalObstacle> = {},
): PhysicalObstacle {
  return {
    id,
    kind: "obstacle",
    name: id,
    position: { xCm: 0, zCm: 0 },
    dimensions: { widthCm: 50, depthCm: 50, heightCm: 200 },
    rotation: 0,
    locked: false,
    ...overrides,
  };
}

function zone(
  id: string,
  overrides: Partial<UnavailableZone> = {},
): UnavailableZone {
  return {
    id,
    kind: "unavailable-zone",
    name: id,
    position: { xCm: 0, zCm: 0 },
    dimensions: { widthCm: 50, depthCm: 50 },
    rotation: 0,
    locked: false,
    ...overrides,
  };
}

function project(
  walls: WallElement[],
  obstacles: Obstacle[] = [],
  placements: Placement[] = [],
): GymProject {
  return {
    version: 3,
    room: { widthCm: 400, depthCm: 400, heightCm: 250 },
    obstacles,
    wallElements: walls,
    placements,
    budget: 50_000,
    trainingGoals: [],
  };
}

const twoDoors = [
  door("wall-element_front", "top", 150),
  door("wall-element_back", "bottom", 150),
];

describe("validateAccess", () => {
  it("emits ACCESS_NOT_EVALUATED once when there is no door", () => {
    const analysis = analyzeProject(project([]), dependencies);
    expect(analysis.access).toEqual({
      evaluated: false,
      reason: "no-door",
      facts: [],
    });
    expect(analysis.issues.filter(({ code }) => code.startsWith("ACCESS") || code.includes("UNREACHABLE") || code === "DOOR_BLOCKED")).toEqual([
      {
        code: "ACCESS_NOT_EVALUATED",
        severity: "warning",
        entityIds: [],
        details: { reason: "no-door" },
      },
    ]);
    expect(analysis.valid).toBe(true);
  });

  it("reports DOOR_BLOCKED when equipment covers a door", () => {
    const issues = validateProject(
      project(
        [door("wall-element_front", "top", 0, 80)],
        [obstacle("obstacle_cover", {
          position: { xCm: 0, zCm: 0 },
          dimensions: { widthCm: 100, depthCm: 40, heightCm: 200 },
        })],
      ),
      dependencies,
    );
    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "DOOR_BLOCKED",
        severity: "error",
        entityIds: ["wall-element_front"],
      }),
    ]));
  });

  it("does not flag a door narrower than 100 cm by itself", () => {
    const issues = validateProject(
      project([door("wall-element_narrow", "top", 150, 70)]),
      dependencies,
    );
    expect(issues.some(({ code }) => code.startsWith("DOOR") || code.startsWith("ACCESS"))).toBe(false);
  });

  it("reports DOOR_UNREACHABLE when the only 100 cm corridor is blocked", () => {
    const issues = validateProject(
      project(
        twoDoors,
        [obstacle("obstacle_bar", {
          position: { xCm: 0, zCm: 160 },
          dimensions: { widthCm: 400, depthCm: 80, heightCm: 200 },
        })],
      ),
      dependencies,
    );
    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "DOOR_UNREACHABLE",
        severity: "error",
        entityIds: ["wall-element_back", "wall-element_front"],
      }),
    ]));
  });

  it("reports USE_ZONE_UNREACHABLE when a bench is walled in", () => {
    const issues = validateProject(
      project(
        [door("wall-element_front", "top", 150)],
        [obstacle("obstacle_bar", {
          position: { xCm: 0, zCm: 160 },
          dimensions: { widthCm: 400, depthCm: 80, heightCm: 200 },
        })],
        [{
          id: "placement_rack",
          productId: rack.id,
          position: { xCm: 40, zCm: 260 },
          rotation: 0,
        }],
      ),
      dependencies,
    );
    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "USE_ZONE_UNREACHABLE",
        severity: "error",
        entityIds: ["placement_rack"],
      }),
    ]));
  });

  it("does not report a zero-margin product unreachable merely for lacking a use zone", () => {
    const issues = validateProject(
      project(
        [door("wall-element_front", "top", 150)],
        [],
        [{
          id: "placement_plates",
          productId: plates.id,
          position: { xCm: 40, zCm: 40 },
          rotation: 0,
        }],
      ),
      dependencies,
    );
    expect(issues.some(({ code }) => code === "USE_ZONE_UNREACHABLE")).toBe(false);
  });

  it("warns for an unapproachable obstacle and leaves the project valid", () => {
    const analysis = analyzeProject(
      project(
        [door("wall-element_front", "top", 150)],
        [
          obstacle("obstacle_bar", {
            position: { xCm: 0, zCm: 160 },
            dimensions: { widthCm: 400, depthCm: 80, heightCm: 200 },
          }),
          obstacle("obstacle_column", {
            position: { xCm: 40, zCm: 300 },
            dimensions: { widthCm: 40, depthCm: 40, heightCm: 200 },
          }),
        ],
      ),
      dependencies,
    );
    expect(analysis.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "OBSTACLE_UNREACHABLE",
        severity: "warning",
        entityIds: ["obstacle_column"],
      }),
    ]));
    expect(analysis.issues.some(({ code }) => code === "USE_ZONE_UNREACHABLE")).toBe(false);
    expect(analysis.valid).toBe(true);
  });

  it("leaves access clear when an unavailable zone or use zone covers the corridor", () => {
    const unavailable = validateProject(
      project(
        twoDoors,
        [zone("obstacle_zone", {
          position: { xCm: 0, zCm: 160 },
          dimensions: { widthCm: 400, depthCm: 80 },
        })],
      ),
      dependencies,
    );
    expect(unavailable.some(({ code }) =>
      code === "DOOR_UNREACHABLE" || code === "DOOR_BLOCKED" || code === "ACCESS_NOT_EVALUATED",
    )).toBe(false);

    const doorwayZone = validateProject(
      project(
        [door("wall-element_front", "top", 150)],
        [zone("obstacle_swing", {
          position: { xCm: 140, zCm: 0 },
          dimensions: { widthCm: 100, depthCm: 80 },
        })],
      ),
      dependencies,
    );
    expect(doorwayZone.some(({ code }) => code === "DOOR_BLOCKED")).toBe(false);

    const useZoneCorridor = validateProject(
      project(
        twoDoors,
        [],
        [{
          id: "placement_rack",
          productId: rack.id,
          position: { xCm: 40, zCm: 140 },
          rotation: 0,
        }],
      ),
      dependencies,
    );
    expect(useZoneCorridor.some(({ code }) => code === "DOOR_UNREACHABLE")).toBe(false);
  });

  it("treats the same corridor footprint as blocking when it is a physical obstacle", () => {
    const blocked = validateProject(
      project(
        twoDoors,
        [obstacle("obstacle_bar", {
          position: { xCm: 0, zCm: 160 },
          dimensions: { widthCm: 400, depthCm: 80, heightCm: 200 },
        })],
      ),
      dependencies,
    );
    expect(blocked.some(({ code }) => code === "DOOR_UNREACHABLE")).toBe(true);
  });

  it("is pure and deterministic", () => {
    const input = project(twoDoors);
    expect(analyzeProject(input, dependencies)).toEqual(
      analyzeProject(input, dependencies),
    );
  });
});
