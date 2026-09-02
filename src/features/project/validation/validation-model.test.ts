import { describe, expect, it } from "vitest";

import { createDefaultProject } from "../defaults";
import type { PhysicalObstacle } from "../schemas/project";
import { collectObstacles } from "./validation-model";

const functionalClearance = { frontCm: 40, backCm: 10, leftCm: 20, rightCm: 30 };

describe("collectObstacles", () => {
  it.each([
    [0, { minX: 80, minZ: 190, maxX: 230, maxZ: 290 }],
    [90, { minX: 60, minZ: 180, maxX: 160, maxZ: 330 }],
    [180, { minX: 70, minZ: 160, maxX: 220, maxZ: 260 }],
    [270, { minX: 90, minZ: 170, maxX: 190, maxZ: 320 }],
  ] as const)("retains the rotated physical and functional footprints at %s degrees", (rotation, expected) => {
    const obstacle: PhysicalObstacle = {
      id: "obstacle_wardrobe",
      kind: "obstacle",
      name: "Wardrobe",
      position: { xCm: 100, zCm: 200 },
      dimensions: { widthCm: 100, depthCm: 50, heightCm: 200 },
      functionalClearance,
      rotation,
      locked: false,
    };
    const [collected] = collectObstacles({
      ...createDefaultProject(),
      obstacles: [obstacle],
    });

    expect(collected.footprint).toMatchObject(
      rotation === 90 || rotation === 270
        ? { minX: 100, minZ: 200, maxX: 150, maxZ: 300 }
        : { minX: 100, minZ: 200, maxX: 200, maxZ: 250 },
    );
    expect(collected.functionalFootprint).toMatchObject(expected);
    expect(collected.hasFunctionalClearance).toBe(true);
  });
});
