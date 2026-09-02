import { describe, expect, it } from "vitest";

import { catalogProductResolver } from "@/features/creator/store/catalog-product-resolver";

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

const mountedBar: ProductValidationDescriptor = {
  id: "product_mounted_bar",
  price: 699,
  dimensions: { widthCm: 112, depthCm: 54, heightCm: 38 },
  useZone: { frontCm: 70, backCm: 0, leftCm: 30, rightCm: 30 },
  minimumCeilingHeightCm: 233,
  mounting: { kind: "wall", bottomHeightCm: 195 },
};

const plates: ProductValidationDescriptor = {
  id: "product_plates",
  price: 200,
  dimensions: { widthCm: 40, depthCm: 40, heightCm: 20 },
  useZone: { frontCm: 0, backCm: 0, leftCm: 0, rightCm: 0 },
};

const tallRack: ProductValidationDescriptor = {
  id: "product_tall_rack",
  price: 2_000,
  dimensions: { widthCm: 50, depthCm: 50, heightCm: 225 },
  useZone: { frontCm: 0, backCm: 0, leftCm: 0, rightCm: 0 },
};

const secondMount: ProductValidationDescriptor = {
  id: "product_second_mount",
  price: 500,
  dimensions: { widthCm: 40, depthCm: 20, heightCm: 10 },
  useZone: { frontCm: 0, backCm: 0, leftCm: 0, rightCm: 0 },
  mounting: { kind: "wall", bottomHeightCm: 195 },
};

const productsById = new Map(
  [mountedBar, plates, tallRack, secondMount].map((product) => [product.id, product] as const),
);

const dependencies = {
  resolveProduct: (productId: string) => productsById.get(productId),
};

function door(wall: WallElement["wall"] = "top", offsetCm = 20): WallElement {
  return {
    id: "wall-element_door",
    kind: "door",
    name: "Door",
    wall,
    offsetCm,
    widthCm: 90,
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

function project(
  placements: TestPlacementInput[],
  extras: {
    readonly obstacles?: Obstacle[];
    readonly wallElements?: WallElement[];
    readonly heightCm?: number;
    readonly widthCm?: number;
    readonly depthCm?: number;
  } = {},
): GymProject {
  return {
    version: 6,
    room: {
      widthCm: extras.widthCm ?? 300,
      depthCm: extras.depthCm ?? 400,
      heightCm: extras.heightCm ?? 250,
    },
    obstacles: extras.obstacles ?? [],
    wallElements: extras.wallElements ?? [door()],
    ...toProjectItemsAndPlacements(placements),
    budget: 10_000,
    trainingGoals: [],
  };
}

describe("validateMounting", () => {
  it.each([
    [0, { xCm: 94, zCm: 0 }],
    [90, { xCm: 246, zCm: 80 }],
    [180, { xCm: 94, zCm: 346 }],
    [270, { xCm: 0, zCm: 80 }],
  ] as const)("accepts a flush mount on rotation %s", (rotation, position) => {
    const issues = validateProject(
      project([{
        id: "placement_bar",
        productId: mountedBar.id,
        position,
        rotation,
      }], { wallElements: [] }),
      dependencies,
    );
    expect(issues.filter(({ code }) => code.startsWith("WALL_MOUNT"))).toEqual([]);
  });

  it("reports WALL_MOUNT_OFF_WALL with the derived wall and gap", () => {
    const issues = validateProject(
      project([{
        id: "placement_bar",
        productId: mountedBar.id,
        position: { xCm: 200, zCm: 80 },
        rotation: 90,
      }]),
      dependencies,
    );
    expect(issues).toEqual(expect.arrayContaining([
      {
        code: "WALL_MOUNT_OFF_WALL",
        severity: "error",
        entityIds: ["placement_bar"],
        details: { wall: "right", gapCm: 46 },
      },
    ]));
  });

  it("reports WALL_MOUNT_OVERLAPS_OPENING when the span crosses a door or window", () => {
    const issues = validateProject(
      project(
        [{
          id: "placement_bar",
          productId: mountedBar.id,
          position: { xCm: 246, zCm: 40 },
          rotation: 90,
        }],
        {
          wallElements: [
            door("top", 20),
            {
              id: "wall-element_window",
              kind: "window",
              name: "Window",
              wall: "right",
              offsetCm: 80,
              widthCm: 120,
            },
          ],
        },
      ),
      dependencies,
    );
    expect(issues).toEqual(expect.arrayContaining([
      {
        code: "WALL_MOUNT_OVERLAPS_OPENING",
        severity: "error",
        entityIds: ["placement_bar", "wall-element_window"],
        details: { wall: "right", overlap: { startCm: 80, endCm: 152 } },
      },
    ]));
  });

  it("treats touching opening edges as clear", () => {
    const issues = validateProject(
      project(
        [{
          id: "placement_bar",
          productId: mountedBar.id,
          position: { xCm: 246, zCm: 80 },
          rotation: 90,
        }],
        {
          wallElements: [
            door("top", 20),
            {
              id: "wall-element_window",
              kind: "window",
              name: "Window",
              wall: "right",
              offsetCm: 192,
              widthCm: 80,
            },
          ],
        },
      ),
      dependencies,
    );
    expect(issues.some(({ code }) => code === "WALL_MOUNT_OVERLAPS_OPENING")).toBe(false);
  });
});

describe("mounted collision filter", () => {
  const barPlacement = {
    id: "placement_bar",
    productId: mountedBar.id,
    position: { xCm: 246, zCm: 80 },
    rotation: 90 as const,
  };

  it("reports a taller placement and a taller obstacle under the mount", () => {
    const withPlacement = validateProject(
      project([
        barPlacement,
        {
          id: "placement_rack",
          productId: tallRack.id,
          position: { xCm: 250, zCm: 90 },
          rotation: 0,
        },
      ]),
      dependencies,
    );
    const withObstacle = validateProject(
      project([barPlacement], {
        obstacles: [obstacle("obstacle_wardrobe", {
          position: { xCm: 250, zCm: 90 },
          dimensions: { widthCm: 50, depthCm: 50, heightCm: 210 },
        })],
      }),
      dependencies,
    );

    expect(withPlacement).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "PHYSICAL_COLLISION",
        entityIds: ["placement_bar", "placement_rack"],
      }),
    ]));
    expect(withObstacle).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "PHYSICAL_COLLISION",
        entityIds: ["obstacle_wardrobe", "placement_bar"],
      }),
    ]));
  });

  it("ignores a shorter entity and an entity exactly as tall as the underside", () => {
    const short = validateProject(
      project([
        barPlacement,
        {
          id: "placement_plates",
          productId: plates.id,
          position: { xCm: 250, zCm: 90 },
          rotation: 0,
        },
      ]),
      dependencies,
    );
    const exact = validateProject(
      project([barPlacement], {
        obstacles: [obstacle("obstacle_exact", {
          position: { xCm: 250, zCm: 90 },
          dimensions: { widthCm: 50, depthCm: 50, heightCm: 195 },
        })],
      }),
      dependencies,
    );

    expect(short.some(({ code }) => code === "PHYSICAL_COLLISION")).toBe(false);
    expect(exact.some(({ code }) => code === "PHYSICAL_COLLISION")).toBe(false);
  });

  it("always reports an unavailable zone and another overlapping mount", () => {
    const underZone = validateProject(
      project([barPlacement], {
        obstacles: [zone("obstacle_radiator", { position: { xCm: 250, zCm: 90 } })],
      }),
      dependencies,
    );
    const twoMounts = validateProject(
      project([
        barPlacement,
        {
          id: "placement_second",
          productId: secondMount.id,
          position: { xCm: 260, zCm: 100 },
          rotation: 90,
        },
      ]),
      dependencies,
    );

    expect(underZone).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "UNAVAILABLE_ZONE_CONFLICT",
        entityIds: ["obstacle_radiator", "placement_bar"],
      }),
    ]));
    expect(twoMounts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "PHYSICAL_COLLISION",
        entityIds: ["placement_bar", "placement_second"],
      }),
    ]));
  });
});

describe("mounted use zones and ceiling", () => {
  it.each([
    [0, { xCm: 144, zCm: 0 }, { xCm: 150, zCm: 40 }],
    [90, { xCm: 346, zCm: 200 }, { xCm: 330, zCm: 210 }],
    [180, { xCm: 144, zCm: 546 }, { xCm: 150, zCm: 530 }],
    [270, { xCm: 0, zCm: 200 }, { xCm: 40, zCm: 210 }],
  ] as const)("reports a low obstacle entering the mounted margin at rotation %s", (
    rotation,
    barPosition,
    blockerPosition,
  ) => {
    const issues = validateProject(
      project([{
        id: "placement_bar",
        productId: mountedBar.id,
        position: barPosition,
        rotation,
      }], {
        widthCm: 400,
        depthCm: 600,
        wallElements: [],
        obstacles: [obstacle("obstacle_low", {
          position: blockerPosition,
          dimensions: { widthCm: 40, depthCm: 40, heightCm: 60 },
        })],
      }),
      dependencies,
    );

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "USE_ZONE_OVERLAP",
        severity: "error",
        entityIds: ["obstacle_low", "placement_bar"],
      }),
    ]));
    expect(issues.some(({ code }) => code === "PHYSICAL_COLLISION")).toBe(false);
  });

  it.each([
    [0, { xCm: 144, zCm: 0 }, { xCm: 150, zCm: 40 }],
    [90, { xCm: 346, zCm: 200 }, { xCm: 330, zCm: 210 }],
    [180, { xCm: 144, zCm: 546 }, { xCm: 150, zCm: 530 }],
    [270, { xCm: 0, zCm: 200 }, { xCm: 40, zCm: 210 }],
  ] as const)("warns for low equipment entering the mounted margin at rotation %s", (
    rotation,
    barPosition,
    blockerPosition,
  ) => {
    const issues = validateProject(
      project([
        {
          id: "placement_bar",
          productId: mountedBar.id,
          position: barPosition,
          rotation,
        },
        {
          id: "placement_plates",
          productId: plates.id,
          position: blockerPosition,
          rotation: 0,
        },
      ], { widthCm: 400, depthCm: 600, wallElements: [] }),
      dependencies,
    );

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "USE_ZONE_OVERLAP",
        severity: "warning",
        entityIds: ["placement_bar", "placement_plates"],
      }),
    ]));
    expect(issues.some(({ code }) => code === "PHYSICAL_COLLISION")).toBe(false);
  });

  it("keeps plates under the bracket silent and plates in the landing as a warning", () => {
    const underBracket = validateProject(
      project([
        {
          id: "placement_bar",
          productId: mountedBar.id,
          position: { xCm: 246, zCm: 80 },
          rotation: 90,
        },
        {
          id: "placement_plates",
          productId: plates.id,
          position: { xCm: 250, zCm: 90 },
          rotation: 0,
        },
      ]),
      dependencies,
    );
    const inLanding = validateProject(
      project([
        {
          id: "placement_bar",
          productId: mountedBar.id,
          position: { xCm: 246, zCm: 80 },
          rotation: 90,
        },
        {
          id: "placement_plates",
          productId: plates.id,
          position: { xCm: 190, zCm: 110 },
          rotation: 0,
        },
      ]),
      dependencies,
    );

    expect(underBracket.some(({ code }) => code === "USE_ZONE_OVERLAP")).toBe(false);
    expect(inLanding).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "USE_ZONE_OVERLAP",
        severity: "warning",
        entityIds: ["placement_bar", "placement_plates"],
      }),
    ]));
  });

  it("derives required ceiling height from the mount top when that exceeds the stored minimum", () => {
    const lowMinimum: ProductValidationDescriptor = {
      ...mountedBar,
      id: "product_low_minimum",
      minimumCeilingHeightCm: 200,
    };
    const issues = validateProject(
      project(
        [{
          id: "placement_bar",
          productId: lowMinimum.id,
          position: { xCm: 246, zCm: 80 },
          rotation: 90,
        }],
        { heightCm: 220 },
      ),
      {
        resolveProduct: (productId) => productId === lowMinimum.id ? lowMinimum : undefined,
      },
    );

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "CEILING_TOO_LOW",
        details: {
          roomHeightCm: 220,
          productHeightCm: 38,
          requiredHeightCm: 233,
          mountBottomHeightCm: 195,
        },
      }),
    ]));
  });
});

describe("supplied mounted-bar project", () => {
  it("loads, validates clean, and reports the catalog bar as mounted", () => {
    const supplied: GymProject = {
      version: 6,
      room: { widthCm: 300, depthCm: 400, heightCm: 250 },
      obstacles: [],
      wallElements: [door("bottom", 100)],
      ...toProjectItemsAndPlacements([{
        id: "placement_anchor_bar",
        productId: "product_anchor_pullup_bar",
        position: { xCm: 246, zCm: 80 },
        rotation: 90,
      }]),
      budget: 10_000,
      trainingGoals: [],
    };

    const analysis = analyzeProject(supplied, { resolveProduct: catalogProductResolver });
    expect(analysis.valid).toBe(true);
    expect(analysis.issues.filter(({ severity }) => severity === "error")).toEqual([]);
    expect(catalogProductResolver("product_anchor_pullup_bar")?.mounting).toEqual({
      kind: "wall",
      bottomHeightCm: 195,
    });
  });

  it("reports the low bed and TV console blocking the left-wall operational margin", () => {
    const supplied: GymProject = {
      version: 6,
      room: { widthCm: 400, depthCm: 600, heightCm: 250 },
      obstacles: [
        obstacle("obstacle_bed", {
          name: "Low bed",
          position: { xCm: 40, zCm: 160 },
          dimensions: { widthCm: 60, depthCm: 60, heightCm: 55 },
        }),
        obstacle("obstacle_tv_console", {
          name: "TV console",
          position: { xCm: 30, zCm: 220 },
          dimensions: { widthCm: 50, depthCm: 50, heightCm: 65 },
        }),
      ],
      wallElements: [],
      ...toProjectItemsAndPlacements([{
        id: "placement_anchor_bar",
        productId: "product_anchor_pullup_bar",
        position: { xCm: 0, zCm: 140 },
        rotation: 270,
      }]),
      budget: 10_000,
      trainingGoals: [],
    };

    const analysis = analyzeProject(supplied, { resolveProduct: catalogProductResolver });
    expect(analysis.valid).toBe(false);
    expect(analysis.issues.filter(({ code, entityIds }) =>
      code === "PHYSICAL_COLLISION" && entityIds.includes("placement_anchor_bar")))
      .toEqual([]);
    expect(analysis.issues.filter(({ code }) => code === "USE_ZONE_OVERLAP"))
      .toEqual([
        {
          code: "USE_ZONE_OVERLAP",
          severity: "error",
          entityIds: ["obstacle_bed", "placement_anchor_bar"],
          details: {
            overlap: { minX: 54, minZ: 160, maxX: 100, maxZ: 220 },
            useZonePlacementId: "placement_anchor_bar",
            blockingEntityId: "obstacle_bed",
          },
        },
        {
          code: "USE_ZONE_OVERLAP",
          severity: "error",
          entityIds: ["obstacle_tv_console", "placement_anchor_bar"],
          details: {
            overlap: { minX: 54, minZ: 220, maxX: 80, maxZ: 252 },
            useZonePlacementId: "placement_anchor_bar",
            blockingEntityId: "obstacle_tv_console",
          },
        },
      ]);
  });
});
