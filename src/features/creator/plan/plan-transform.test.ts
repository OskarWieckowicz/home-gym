import { describe, expect, it } from "vitest";

import type { Obstacle } from "@/features/project/schemas/project";

import {
  createPlanTransform,
  obstacleToPlanRectangle,
  planDeltaToCentimeters,
  planPointToCentimeters,
  snapCentimeters,
} from "./plan-transform";

describe("plan transform", () => {
  it.each([
    [{ widthCm: 600, depthCm: 300 }, 1.2, 40, 100],
    [{ widthCm: 300, depthCm: 600 }, 0.8, 280, 40],
    [{ widthCm: 400, depthCm: 400 }, 1.2, 160, 40],
  ] as const)("fits and centers room %#", (room, scale, offsetX, offsetY) => {
    expect(createPlanTransform(room, { width: 800, height: 560 }, 40)).toEqual({
      scale,
      offsetX,
      offsetY,
      roomWidth: room.widthCm * scale,
      roomHeight: room.depthCm * scale,
    });
  });

  it("maps room edges and round trips snapped points", () => {
    const transform = createPlanTransform({ widthCm: 400, depthCm: 320 }, { width: 760, height: 560 }, 40);
    expect(planPointToCentimeters({ x: transform.offsetX, y: transform.offsetY }, transform)).toEqual({ xCm: 0, zCm: 0 });
    expect(planPointToCentimeters({ x: transform.offsetX + transform.roomWidth, y: transform.offsetY + transform.roomHeight }, transform)).toEqual({ xCm: 400, zCm: 320 });
  });

  it("snaps near half-step boundaries and never returns negative points", () => {
    expect(snapCentimeters(4.9, 10)).toBe(0);
    expect(snapCentimeters(5, 10)).toBe(10);
    expect(snapCentimeters(-100, 10)).toBe(0);
    expect(planDeltaToCentimeters({ x: -15, y: 24 }, { scale: 2 }, 10)).toEqual({ xCm: -10, zCm: 10 });
  });

  it.each([0, 90, 180, 270] as const)("renders rotation %s from domain footprint", (rotation) => {
    const obstacle: Obstacle = {
      id: "obstacle_one",
      kind: "obstacle",
      name: "One",
      position: { xCm: 20, zCm: 30 },
      dimensions: { widthCm: 100, depthCm: 40, heightCm: 200 },
      rotation,
      locked: false,
    };
    const rectangle = obstacleToPlanRectangle(obstacle, { scale: 2, offsetX: 5, offsetY: 7, roomWidth: 0, roomHeight: 0 });
    expect(rectangle).toMatchObject({ x: 45, y: 67 });
    expect([rectangle.width, rectangle.height]).toEqual(rotation === 90 || rotation === 270 ? [80, 200] : [200, 80]);
  });
});
