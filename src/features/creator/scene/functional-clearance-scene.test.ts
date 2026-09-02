import { describe, expect, it } from "vitest";

import type { PhysicalObstacle } from "@/features/project/schemas/project";

import { obstacleFunctionalClearanceToScene } from "./scene-transform";

const room = { widthCm: 500, depthCm: 400, heightCm: 250 };

describe("obstacleFunctionalClearanceToScene", () => {
  it.each([
    [0, { x: -0.95, z: -0.6 }, { x: 1.5, z: 1 }],
    [90, { x: -1.4, z: -0.45 }, { x: 1, z: 1.5 }],
    [180, { x: -1.05, z: -0.9 }, { x: 1.5, z: 1 }],
    [270, { x: -1.1, z: -0.55 }, { x: 1, z: 1.5 }],
  ] as const)("uses the rotated directional footprint at %s°", (rotation, position, dimensions) => {
    const obstacle: PhysicalObstacle = {
      id: "obstacle_desk",
      kind: "obstacle",
      name: "Desk",
      position: { xCm: 100, zCm: 100 },
      dimensions: { widthCm: 100, depthCm: 50, heightCm: 75 },
      functionalClearance: { frontCm: 40, backCm: 10, leftCm: 20, rightCm: 30 },
      rotation,
      locked: false,
    };

    const box = obstacleFunctionalClearanceToScene(obstacle, room);
    expect(box.position.x).toBeCloseTo(position.x);
    expect(box.position.z).toBeCloseTo(position.z);
    expect(box.dimensions.x).toBeCloseTo(dimensions.x);
    expect(box.dimensions.z).toBeCloseTo(dimensions.z);
  });
});
