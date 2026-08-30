import { describe, expect, it } from "vitest";

import type {
  GymProject,
  Obstacle,
  PhysicalObstacle,
  UnavailableZone,
  WallElement,
} from "../schemas/project";
import type { ProductValidationDescriptor } from "./product-validation";
import { toProjectItemsAndPlacements, type TestPlacementInput } from "./test-placed-equipment";
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

/** A compact plate set: small footprint with use-zone margins under a walking width. */
const compactPlates: ProductValidationDescriptor = {
  id: "product_compact_plates",
  price: 1_200,
  dimensions: { widthCm: 45, depthCm: 24, heightCm: 45 },
  useZone: { frontCm: 25, backCm: 10, leftCm: 25, rightCm: 25 },
};

const bar: ProductValidationDescriptor = {
  id: "product_bar",
  price: 1_500,
  dimensions: { widthCm: 400, depthCm: 5, heightCm: 5 },
  useZone: { frontCm: 0, backCm: 0, leftCm: 0, rightCm: 0 },
};

const mountedBar: ProductValidationDescriptor = {
  id: "product_mounted_bar",
  price: 699,
  dimensions: { widthCm: 112, depthCm: 54, heightCm: 38 },
  useZone: { frontCm: 70, backCm: 0, leftCm: 30, rightCm: 30 },
  mounting: { kind: "wall", bottomHeightCm: 195 },
};

const productsById = new Map(
  [rack, plates, compactPlates, bar, mountedBar].map(
    (product) => [product.id, product] as const,
  ),
);

const dependencies = {
  resolveProduct: (productId: string) => productsById.get(productId),
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
  placements: TestPlacementInput[] = [],
): GymProject {
  return {
    version: 4,
    room: { widthCm: 400, depthCm: 400, heightCm: 250 },
    obstacles,
    wallElements: walls,
    ...toProjectItemsAndPlacements(placements),
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

  it("reaches a compact item whose use-zone margins are narrower than a walking path", () => {
    const analysis = analyzeProject(
      project(
        [door("wall-element_front", "top", 150)],
        [],
        [{
          id: "placement_compact",
          productId: compactPlates.id,
          position: { xCm: 330, zCm: 300 },
          rotation: 0,
        }],
      ),
      dependencies,
    );
    expect(analysis.access.facts).toEqual(expect.arrayContaining([
      { entityId: "placement_compact", kind: "use-zone", state: "comfortable" },
    ]));
    expect(analysis.valid).toBe(true);
  });

  it("reports ACCESS_TIGHT when the only approach is passable but not comfortable", () => {
    const analysis = analyzeProject(
      project(
        [door("wall-element_front", "top", 150)],
        [
          obstacle("obstacle_left", {
            position: { xCm: 0, zCm: 160 },
            dimensions: { widthCm: 160, depthCm: 80, heightCm: 200 },
          }),
          obstacle("obstacle_right", {
            position: { xCm: 240, zCm: 160 },
            dimensions: { widthCm: 160, depthCm: 80, heightCm: 200 },
          }),
        ],
        [{
          id: "placement_rack",
          productId: rack.id,
          position: { xCm: 40, zCm: 250 },
          rotation: 0,
        }],
      ),
      dependencies,
    );
    expect(analysis.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "ACCESS_TIGHT",
        severity: "warning",
        entityIds: ["placement_rack"],
        details: { kind: "use-zone" },
      }),
    ]));
    expect(analysis.issues.some(({ code }) => code === "USE_ZONE_UNREACHABLE")).toBe(false);
    expect(analysis.valid).toBe(true);
  });

  it("does not let reach travel through a gap narrower than a walking path", () => {
    const narrowSlot: Obstacle[] = [
      obstacle("obstacle_left", {
        position: { xCm: 0, zCm: 160 },
        dimensions: { widthCm: 170, depthCm: 80, heightCm: 200 },
      }),
      obstacle("obstacle_right", {
        position: { xCm: 230, zCm: 160 },
        dimensions: { widthCm: 170, depthCm: 80, heightCm: 200 },
      }),
    ];
    const behindTheSlot = validateProject(
      project(
        [door("wall-element_front", "top", 150)],
        narrowSlot,
        [{
          id: "placement_rack",
          productId: rack.id,
          position: { xCm: 40, zCm: 250 },
          rotation: 0,
        }],
      ),
      dependencies,
    );
    expect(behindTheSlot).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "USE_ZONE_UNREACHABLE",
        severity: "error",
        entityIds: ["placement_rack"],
      }),
    ]));

    const doorsAcrossTheSlot = validateProject(
      project(twoDoors, narrowSlot),
      dependencies,
    );
    expect(doorsAcrossTheSlot.some(({ code }) => code === "DOOR_UNREACHABLE")).toBe(true);
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

  it("lets a walking path run under a mounted bar that would block as a floor item", () => {
    const corridorDoors = [
      door("wall-element_front", "top", 55),
      door("wall-element_back", "bottom", 55),
    ];
    const corridor = {
      ...project(corridorDoors),
      room: { widthCm: 200, depthCm: 400, heightCm: 250 },
    };
    const placed = toProjectItemsAndPlacements([{
      id: "placement_bar",
      productId: mountedBar.id,
      position: { xCm: 44, zCm: 174 },
      rotation: 0,
    }]);
    const mounted = validateProject(
      { ...corridor, ...placed },
      dependencies,
    );
    const asFloor = validateProject(
      { ...corridor, ...placed },
      {
        resolveProduct: (productId) => {
          if (productId !== mountedBar.id) return productsById.get(productId);
          const { mounting: _mounting, ...floorProduct } = mountedBar;
          return floorProduct;
        },
      },
    );

    expect(mounted.some(({ code }) => code === "DOOR_UNREACHABLE")).toBe(false);
    expect(asFloor.some(({ code }) => code === "DOOR_UNREACHABLE")).toBe(true);
  });

  it("lets a walking path cross geometry no taller than the step-over height", () => {
    const barAcrossTheRoom = validateProject(
      project(
        twoDoors,
        [],
        [{
          id: "placement_bar",
          productId: bar.id,
          position: { xCm: 0, zCm: 200 },
          rotation: 0,
        }],
      ),
      dependencies,
    );
    expect(barAcrossTheRoom.some(({ code }) => code === "DOOR_UNREACHABLE")).toBe(false);
    expect(barAcrossTheRoom.some(({ code }) => code === "USE_ZONE_UNREACHABLE")).toBe(false);

    const lowObstacleAcrossTheRoom = validateProject(
      project(
        twoDoors,
        [obstacle("obstacle_threshold", {
          position: { xCm: 0, zCm: 200 },
          dimensions: { widthCm: 400, depthCm: 80, heightCm: 15 },
        })],
      ),
      dependencies,
    );
    expect(lowObstacleAcrossTheRoom.some(({ code }) => code === "DOOR_UNREACHABLE")).toBe(false);
  });

  it("is pure and deterministic", () => {
    const input = project(twoDoors);
    expect(analyzeProject(input, dependencies)).toEqual(
      analyzeProject(input, dependencies),
    );
  });
});
