import { describe, expect, it } from "vitest";

import type { GymProject, Obstacle, PhysicalObstacle, UnavailableZone, WallElement } from "../schemas/project";
import type { ProductValidationDescriptor } from "./product-validation";
import { toProjectItemsAndPlacements, type TestPlacementInput } from "./test-placed-equipment";
import { analyzeProject, validateProject } from "./validate-project";

const product: ProductValidationDescriptor = {
  id: "product_test",
  price: 6_000,
  dimensions: { widthCm: 100, depthCm: 50, heightCm: 210 },
  useZone: { frontCm: 30, backCm: 10, leftCm: 20, rightCm: 20 },
  minimumCeilingHeightCm: 230,
};

const validationDependencies = {
  resolveProduct: (productId: string) =>
    productId === product.id ? product : undefined,
};

function placement(
  id: string,
  overrides: Partial<TestPlacementInput> = {},
): TestPlacementInput {
  return {
    id,
    productId: product.id,
    position: { xCm: 0, zCm: 0 },
    rotation: 0,
    ...overrides,
  };
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
    functionalClearance: { frontCm: 0, backCm: 0, leftCm: 0, rightCm: 0 },
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

function entrance(): WallElement {
  return {
    id: "wall-element_door",
    kind: "door",
    name: "Door",
    wall: "top",
    offsetCm: 20,
    widthCm: 90,
  };
}

function project(
  obstacles: Obstacle[],
  wallElements: WallElement[] = [entrance()],
  placements: TestPlacementInput[] = [],
): GymProject {
  return {
    version: 6,
    room: { widthCm: 300, depthCm: 250, heightCm: 220 },
    obstacles,
    wallElements,
    ...toProjectItemsAndPlacements(placements),
    budget: 10_000,
    trainingGoals: [],
  };
}

describe("validateProject", () => {
  it("reports exact furniture functional-clearance overlaps and accepts edge touch", () => {
    const wardrobe = obstacle("obstacle_wardrobe", {
      position: { xCm: 0, zCm: 100 },
      functionalClearance: { frontCm: 30, backCm: 0, leftCm: 0, rightCm: 0 },
    });
    const physical = validateProject(
      project([wardrobe], [entrance()], [placement("placement_blocker", {
        position: { xCm: 0, zCm: 179 },
      })]),
      validationDependencies,
    ).filter(({ code }) => code === "FUNCTIONAL_ZONE_OVERLAP");
    expect(physical).toEqual([{
      code: "FUNCTIONAL_ZONE_OVERLAP",
      severity: "error",
      entityIds: ["obstacle_wardrobe", "placement_blocker"],
      details: {
        zoneOwnerId: "obstacle_wardrobe",
        blockingEntityId: "placement_blocker",
        overlap: { minX: 0, minZ: 179, maxX: 50, maxZ: 180 },
      },
    }]);

    const competing = validateProject(
      project([wardrobe], [entrance()], [placement("placement_competing", {
        position: { xCm: 0, zCm: 159 },
      })]),
      validationDependencies,
    ).filter(({ entityIds }) => {
      const ids: readonly string[] = entityIds;
      return ids.includes("obstacle_wardrobe") && ids.includes("placement_competing");
    });
    expect(competing).toHaveLength(1);
    expect(competing[0]).toMatchObject({
      code: "FUNCTIONAL_ZONE_OVERLAP",
      severity: "error",
    });

    const useZoneOnly = validateProject(
      project([wardrobe], [entrance()], [placement("placement_activity", {
        position: { xCm: 0, zCm: 180 },
      })]),
      validationDependencies,
    ).filter(({ code }) => code === "FUNCTIONAL_ZONE_OVERLAP");
    expect(useZoneOnly).toEqual([expect.objectContaining({
      severity: "warning",
      details: expect.objectContaining({
        overlap: { minX: 0, minZ: 170, maxX: 50, maxZ: 180 },
      }),
    })]);
  });

  it("warns once per furniture pair and lets physical collisions suppress functional duplicates", () => {
    const wardrobe = obstacle("obstacle_wardrobe", {
      position: { xCm: 0, zCm: 100 },
      functionalClearance: { frontCm: 30, backCm: 0, leftCm: 0, rightCm: 0 },
    });
    const encroaching = obstacle("obstacle_chair", { position: { xCm: 0, zCm: 179 } });
    const warning = validateProject(project([wardrobe, encroaching]))
      .filter(({ code }) => code === "FUNCTIONAL_ZONE_OVERLAP");
    expect(warning).toEqual([expect.objectContaining({
      severity: "warning",
      details: expect.objectContaining({
        zoneOwnerId: "obstacle_wardrobe",
        blockingEntityId: "obstacle_chair",
        overlap: { minX: 0, minZ: 179, maxX: 50, maxZ: 180 },
      }),
    })]);

    const touching = obstacle("obstacle_chair", { position: { xCm: 0, zCm: 180 } });
    expect(validateProject(project([wardrobe, touching]))
      .some(({ code }) => code === "FUNCTIONAL_ZONE_OVERLAP")).toBe(false);

    const colliding = obstacle("obstacle_chair", { position: { xCm: 0, zCm: 149 } });
    const suppressed = validateProject(project([wardrobe, colliding]));
    expect(suppressed.some(({ code }) => code === "PHYSICAL_COLLISION")).toBe(true);
    expect(suppressed.some(({ code }) => code === "FUNCTIONAL_ZONE_OVERLAP")).toBe(false);
  });

  it("validates placement bounds, physical obstacles, and unavailable zones", () => {
    const issues = validateProject(
      project(
        [
          obstacle("obstacle_physical", { position: { xCm: 20, zCm: 20 } }),
          zone("obstacle_zone", { position: { xCm: 80, zCm: 10 } }),
        ],
        [entrance()],
        [
          placement("placement_inside"),
          placement("placement_outside", { position: { xCm: 250, zCm: 220 } }),
        ],
      ),
      validationDependencies,
    );

    const codes = new Set(issues.map(({ code }) => code));
    for (const code of [
      "PHYSICAL_COLLISION",
      "USE_ZONE_OUTSIDE_ROOM",
      "UNAVAILABLE_ZONE_CONFLICT",
      "BUDGET_EXCEEDED",
      "CEILING_TOO_LOW",
      "OUTSIDE_ROOM",
    ] as const) {
      expect(codes.has(code)).toBe(true);
    }
    expect(issues.some(({ code }) => code === "USE_ZONE_OVERLAP")).toBe(false);
  });

  it("detects placement physical and use-zone conflicts but accepts touching edges", () => {
    const physicalOverlap = validateProject(
      project([], [entrance()], [placement("placement_a"), placement("placement_b", {
        position: { xCm: 99, zCm: 0 },
      })]),
      validationDependencies,
    );
    expect(physicalOverlap).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "PHYSICAL_COLLISION",
        entityIds: ["placement_a", "placement_b"],
      }),
    ]));
    expect(physicalOverlap.some(({ code }) => code === "USE_ZONE_OVERLAP")).toBe(
      false,
    );

    const touching = validateProject(
      project(
        [obstacle("obstacle_touching", { position: { xCm: 120, zCm: 0 } })],
        [entrance()],
        [placement("placement_a")],
      ),
      validationDependencies,
    );
    expect(touching.some(({ code }) => code === "USE_ZONE_OVERLAP")).toBe(false);

    const useZoneOverlap = validateProject(
      project(
        [obstacle("obstacle_overlap", { position: { xCm: 119, zCm: 0 } })],
        [entrance()],
        [placement("placement_a")],
      ),
      validationDependencies,
    );
    expect(useZoneOverlap).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "USE_ZONE_OVERLAP", severity: "error" }),
    ]));
  });

  it("reports a rotated use zone outside the room independently of physical bounds", () => {
    const issues = validateProject(
      project([], [entrance()], [placement("placement_edge", {
        position: { xCm: 0, zCm: 20 },
        rotation: 90,
      })]),
      validationDependencies,
    );

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "USE_ZONE_OUTSIDE_ROOM",
        entityIds: ["placement_edge"],
        details: expect.objectContaining({ axes: ["x"] }),
      }),
    ]));
    expect(issues.some(({ code }) => code === "OUTSIDE_ROOM")).toBe(false);
  });

  it("reports ceiling and aggregate budget errors with stable details", () => {
    const input = project(
        [],
        [entrance()],
        [placement("placement_b", { position: { xCm: 150, zCm: 100 } }), placement("placement_a")],
    );
    const issues = validateProject(input, validationDependencies);

    expect(issues).toEqual(expect.arrayContaining([
      {
        code: "BUDGET_EXCEEDED",
        severity: "error",
        entityIds: ["project-item_a", "project-item_b"],
        details: { budget: 10_000, totalPrice: 12_000, excess: 2_000 },
      },
      expect.objectContaining({
        code: "CEILING_TOO_LOW",
        details: { roomHeightCm: 220, productHeightCm: 210, requiredHeightCm: 230 },
      }),
    ]));
  });

  it("returns no issues for an empty or valid non-overlapping room", () => {
    expect(validateProject(project([]))).toEqual([]);
    expect(
      validateProject(
        project([
          obstacle("obstacle_a"),
          obstacle("obstacle_b", { position: { xCm: 50, zCm: 50 } }),
        ]),
      ),
    ).toEqual([]);
  });

  it("reports horizontal and height overflow together", () => {
    const issues = validateProject(
      project([
        obstacle("obstacle_outside", {
          position: { xCm: 270, zCm: 230 },
          dimensions: { widthCm: 40, depthCm: 30, heightCm: 221 },
        }),
      ]),
    );

    expect(issues).toEqual([
      {
        code: "OUTSIDE_ROOM",
        severity: "error",
        entityIds: ["obstacle_outside"],
        details: {
          axes: ["x", "z", "height"],
          footprint: { minX: 270, minZ: 230, maxX: 310, maxZ: 260 },
          room: { widthCm: 300, depthCm: 250, heightCm: 220 },
          entityHeightCm: 221,
        },
      },
    ]);
  });

  it("applies the collision matrix and reports all issue kinds in one pass", () => {
    const issues = validateProject(
      project([
        obstacle("obstacle_b", { position: { xCm: 30, zCm: 30 } }),
        obstacle("obstacle_a"),
        zone("obstacle_zone", {
          position: { xCm: 40, zCm: 40 },
        }),
        zone("obstacle_zone-two", {
          position: { xCm: 45, zCm: 45 },
        }),
        obstacle("obstacle_outside", {
          position: { xCm: 290, zCm: 0 },
        }),
      ]),
    );

    expect(issues.map(({ code, entityIds }) => ({ code, entityIds }))).toEqual([
      { code: "PHYSICAL_COLLISION", entityIds: ["obstacle_a", "obstacle_b"] },
      {
        code: "UNAVAILABLE_ZONE_CONFLICT",
        entityIds: ["obstacle_a", "obstacle_zone"],
      },
      {
        code: "UNAVAILABLE_ZONE_CONFLICT",
        entityIds: ["obstacle_a", "obstacle_zone-two"],
      },
      {
        code: "UNAVAILABLE_ZONE_CONFLICT",
        entityIds: ["obstacle_b", "obstacle_zone"],
      },
      {
        code: "UNAVAILABLE_ZONE_CONFLICT",
        entityIds: ["obstacle_b", "obstacle_zone-two"],
      },
      { code: "OUTSIDE_ROOM", entityIds: ["obstacle_outside"] },
    ]);
    expect(
      issues.some((issue) => {
        const ids: readonly string[] = issue.entityIds;
        return ids.includes("obstacle_zone") && ids.includes("obstacle_zone-two");
      }),
    ).toBe(false);
  });

  it("normalizes pairs and issue ordering independently of input order", () => {
    const obstacles = [
      obstacle("obstacle_z", { position: { xCm: 20, zCm: 20 } }),
      obstacle("obstacle_a"),
      zone("obstacle_zone", {
        position: { xCm: 10, zCm: 10 },
      }),
    ];

    const forward = validateProject(project(obstacles));
    const reversed = validateProject(project([...obstacles].reverse()));

    expect(reversed).toEqual(forward);
    expect(
      forward.every(
        (issue) =>
          issue.entityIds.length < 2 || issue.entityIds[0]! < issue.entityIds[1]!,
      ),
    ).toBe(true);
    expect(new Set(forward.map((issue) => JSON.stringify(issue.entityIds))).size).toBe(
      forward.length,
    );
  });

  it("orders punctuation-bearing IDs by code units rather than host locale", () => {
    const issues = validateProject(
      project([
        obstacle("obstacle_a_b"),
        obstacle("obstacle_a-b"),
        obstacle("obstacle_z"),
      ]),
    );

    expect(issues.map(({ entityIds }) => entityIds)).toEqual([
      ["obstacle_a-b", "obstacle_a_b"],
      ["obstacle_a-b", "obstacle_z"],
      ["obstacle_a_b", "obstacle_z"],
    ]);
  });

  it("is repeatable, JSON-serializable, and does not mutate frozen input", () => {
    const first = obstacle("obstacle_a");
    Object.freeze(first.position);
    Object.freeze(first.dimensions);
    Object.freeze(first);
    const input = project([first]);
    Object.freeze(input.room);
    Object.freeze(input.obstacles);
    Object.freeze(input.trainingGoals);
    Object.freeze(input);

    const firstResult = validateProject(input);
    const secondResult = validateProject(input);

    expect(secondResult).toEqual(firstResult);
    expect(() => JSON.stringify(firstResult)).not.toThrow();
  });

  it("accepts edge contact but detects one-centimeter overlap symmetrically", () => {
    const fixed = obstacle("obstacle_fixed");
    const touching = obstacle("obstacle_touching", {
      position: { xCm: 50, zCm: 0 },
    });
    const overlapping = obstacle("obstacle_overlapping", {
      position: { xCm: 49, zCm: 0 },
    });

    expect(validateProject(project([fixed, touching]))).toEqual([]);
    expect(validateProject(project([fixed, overlapping]))).toEqual(
      validateProject(project([overlapping, fixed])),
    );
    expect(validateProject(project([fixed, overlapping]))[0]).toMatchObject({
      code: "PHYSICAL_COLLISION",
      details: { overlap: { minX: 49, maxX: 50, minZ: 0, maxZ: 50 } },
    });
  });

  it("does not apply ceiling-height validation to unavailable zones", () => {
    expect(validateProject(project([zone("obstacle_zone")]))).toEqual([]);
  });

  it("validates wall bounds and positive same-wall overlap", () => {
    const elements: WallElement[] = [
      {
        id: "wall-element_door",
        kind: "door",
        name: "Door",
        wall: "top",
        offsetCm: 250,
        widthCm: 60,
      },
      {
        id: "wall-element_window-overlap",
        kind: "window",
        name: "Window",
        wall: "top",
        offsetCm: 200,
        widthCm: 60,
      },
      {
        id: "wall-element_window-touching",
        kind: "window",
        name: "Window 2",
        wall: "top",
        offsetCm: 140,
        widthCm: 60,
      },
      {
        id: "wall-element_other-wall",
        kind: "window",
        name: "Window 3",
        wall: "bottom",
        offsetCm: 250,
        widthCm: 60,
      },
    ];

    expect(
      validateProject(project([], elements)).map(({ code, entityIds }) => ({
        code,
        entityIds,
      })),
    ).toEqual([
      { code: "OUTSIDE_WALL", entityIds: ["wall-element_door"] },
      {
        code: "WALL_ELEMENT_OVERLAP",
        entityIds: ["wall-element_door", "wall-element_window-overlap"],
      },
      { code: "OUTSIDE_WALL", entityIds: ["wall-element_other-wall"] },
    ]);
  });

  it("demotes equipment occupying another item's use zone to a single warning", () => {
    const issues = validateProject(
      {
        ...project(
        [],
        [entrance()],
        [
            placement("placement_rack", { position: { xCm: 40, zCm: 20 } }),
            placement("placement_bench", { position: { xCm: 40, zCm: 71 } }),
          ],
        ),
        room: { widthCm: 400, depthCm: 400, heightCm: 250 },
        budget: 50_000,
      },
      validationDependencies,
    );

    expect(issues.filter(({ code }) => code === "USE_ZONE_OVERLAP")).toEqual([
      expect.objectContaining({
        code: "USE_ZONE_OVERLAP",
        severity: "warning",
        entityIds: ["placement_bench", "placement_rack"],
      }),
    ]);
    expect(issues.some(({ severity }) => severity === "error")).toBe(false);
  });

  it("warns when two use zones overlap without a physical collision", () => {
    const issues = validateProject(
      {
        ...project(
        [],
        [entrance()],
        [
            placement("placement_a", { position: { xCm: 40, zCm: 20 } }),
            placement("placement_b", { position: { xCm: 40, zCm: 105 } }),
          ],
        ),
        room: { widthCm: 400, depthCm: 400, heightCm: 250 },
        budget: 50_000,
      },
      validationDependencies,
    );

    expect(issues.filter(({ code }) => code === "USE_ZONE_OVERLAP")).toEqual([
      expect.objectContaining({
        code: "USE_ZONE_OVERLAP",
        severity: "warning",
        entityIds: ["placement_a", "placement_b"],
      }),
    ]);
  });
});

describe("analyzeProject", () => {
  it("derives valid from error-severity issues only", () => {
    const warningOnly = analyzeProject(
      {
        ...project(
        [],
        [entrance()],
        [
            placement("placement_rack", { position: { xCm: 40, zCm: 20 } }),
            placement("placement_bench", { position: { xCm: 40, zCm: 71 } }),
          ],
        ),
        room: { widthCm: 400, depthCm: 400, heightCm: 250 },
        budget: 50_000,
      },
      validationDependencies,
    );

    expect(warningOnly).toMatchObject({
      valid: true,
      errorCount: 0,
      warningCount: 1,
    });
    expect(warningOnly.issues).toHaveLength(1);
  });

  it("is pure, deterministic, and counts mixed severities", () => {
    const input = project(
      [obstacle("obstacle_overlap", { position: { xCm: 119, zCm: 0 } })],
      [entrance()],
      [placement("placement_a")],
    );
    const first = analyzeProject(input, validationDependencies);
    const second = analyzeProject(input, validationDependencies);

    expect(second).toEqual(first);
    expect(first.valid).toBe(false);
    expect(first.errorCount).toBeGreaterThan(0);
    expect(first.issues.every((issue) => issue.severity === "error" || issue.severity === "warning")).toBe(true);
  });

  it("counts unplaced and selection-only items once for budget and coverage", () => {
    const bands: ProductValidationDescriptor = {
      id: "product_bands",
      price: 250,
      dimensions: { widthCm: 10, depthCm: 10, heightCm: 4 },
      useZone: { frontCm: 0, backCm: 0, leftCm: 0, rightCm: 0 },
      placementMode: "selection-only",
      trainingGoals: ["mobility", "strength"],
    };
    const analysis = analyzeProject(
      {
        ...project([], [entrance()], [placement("placement_a")]),
        projectItems: [
          { id: "project-item_a", productId: product.id },
          { id: "project-item_bands", productId: bands.id },
        ],
        budget: 6_000,
        trainingGoals: ["strength", "mobility", "conditioning"],
      },
      {
        resolveProduct: (productId) =>
          productId === product.id ? product : productId === bands.id ? bands : undefined,
      },
    );

    expect(analysis.items).toEqual([
      {
        id: "project-item_a",
        productId: product.id,
        placementId: "placement_a",
        placed: true,
        placementMode: "floor",
        price: 6_000,
      },
      {
        id: "project-item_bands",
        productId: bands.id,
        placementId: null,
        placed: false,
        placementMode: "selection-only",
        price: 250,
      },
    ]);
    expect(analysis.coverage).toEqual({
      requested: ["strength", "mobility", "conditioning"],
      covered: ["strength", "mobility"],
      uncovered: ["conditioning"],
    });
    expect(analysis.issues).toEqual(expect.arrayContaining([
      {
        code: "BUDGET_EXCEEDED",
        severity: "error",
        entityIds: ["project-item_a", "project-item_bands"],
        details: { budget: 6_000, totalPrice: 6_250, excess: 250 },
      },
    ]));
  });
});
