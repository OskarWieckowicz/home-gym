import { describe, expect, it } from "vitest";

import { type RectangleBounds } from "./rectangles";
import { measureSelectionDistances } from "./selection-distances";

const room = { widthCm: 500, depthCm: 600 };
const footprint = { minX: 100, minZ: 200, maxX: 200, maxZ: 300 };

function obstacle(bounds: RectangleBounds, id = "pillar-a") {
  return { id, name: `Pillar ${id}`, bounds };
}

describe("measureSelectionDistances", () => {
  it("reports signed gaps from the physical edges to each room wall", () => {
    expect(measureSelectionDistances(footprint, room, []).wallsCm).toEqual({
      top: 200,
      right: 300,
      bottom: 300,
      left: 100,
    });
  });

  it("preserves negative gaps outside all four walls", () => {
    const outside = { minX: -10, minZ: -20, maxX: 530, maxZ: 640 };
    expect(measureSelectionDistances(outside, room, []).wallsCm).toEqual({
      top: -20,
      right: -30,
      bottom: -40,
      left: -10,
    });
  });

  it("reports zero gap when equipment is flush with a wall", () => {
    const flush = { minX: 0, minZ: 0, maxX: 500, maxZ: 600 };
    expect(measureSelectionDistances(flush, room, []).wallsCm).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    });
  });

  it.each([
    ["right", { minX: 230, minZ: 220, maxX: 250, maxZ: 240 }, 30],
    ["left", { minX: 50, minZ: 220, maxX: 70, maxZ: 240 }, 30],
    ["top", { minX: 120, minZ: 150, maxX: 140, maxZ: 180 }, 20],
    ["bottom", { minX: 120, minZ: 330, maxX: 140, maxZ: 350 }, 30],
    ["diagonal", { minX: 230, minZ: 340, maxX: 250, maxZ: 360 }, 50],
  ] as const)("measures the shortest edge gap for a %s obstacle", (_, bounds, distanceCm) => {
    expect(measureSelectionDistances(footprint, room, [obstacle(bounds)]).nearestObstacle)
      .toEqual({ id: "pillar-a", name: "Pillar pillar-a", distanceCm, status: "separated" });
  });

  it.each([
    ["edge touching", { minX: 200, minZ: 220, maxX: 220, maxZ: 240 }, "touching"],
    ["corner touching", { minX: 200, minZ: 300, maxX: 220, maxZ: 320 }, "touching"],
    ["partly overlapping", { minX: 180, minZ: 280, maxX: 220, maxZ: 320 }, "overlapping"],
    ["contained", { minX: 120, minZ: 220, maxX: 140, maxZ: 240 }, "overlapping"],
  ] as const)("distinguishes %s from a positive gap", (_, bounds, status) => {
    expect(measureSelectionDistances(footprint, room, [obstacle(bounds)]).nearestObstacle)
      .toMatchObject({ distanceCm: 0, status });
  });

  it("returns the nearest obstacle and its identity, regardless of list order", () => {
    const farther = obstacle({ minX: 300, minZ: 200, maxX: 320, maxZ: 220 }, "farther");
    const nearer = obstacle({ minX: 220, minZ: 200, maxX: 240, maxZ: 220 }, "nearer");
    for (const obstacles of [[farther, nearer], [nearer, farther]]) {
      expect(measureSelectionDistances(footprint, room, obstacles).nearestObstacle)
        .toEqual({ id: "nearer", name: "Pillar nearer", distanceCm: 20, status: "separated" });
    }
  });

  it("breaks equal-distance ties by stable id, not order or display name", () => {
    const bounds = { minX: 220, minZ: 200, maxX: 240, maxZ: 220 };
    const first = { ...obstacle(bounds, "a"), name: "Zebra" };
    const second = { ...obstacle(bounds, "b"), name: "Alpha" };
    for (const obstacles of [[first, second], [second, first]]) {
      expect(measureSelectionDistances(footprint, room, obstacles).nearestObstacle)
        .toMatchObject({ id: "a", name: "Zebra", distanceCm: 20 });
    }
  });

  it("returns null when there are no physical obstacles", () => {
    expect(measureSelectionDistances(footprint, room, []).nearestObstacle).toBeNull();
  });
});
