import { describe, expect, it } from "vitest";

import type { Obstacle } from "@/features/project/schemas/project";

import {
  clientPointToPlanPoint,
  createPlanTransform,
  obstacleToPlanRectangle,
  planDeltaToCentimeters,
  planPointToCentimeters,
  snapCentimeters,
  wallElementToPlanLine,
} from "./plan-transform";

describe("plan transform", () => {
  it("accounts for xMidYMid meet letterboxing when mapping client points", () => {
    const scale = 417 / 560;
    const horizontalInset = (621 - 760 * scale) / 2;
    const point = clientPointToPlanPoint(
      {
        clientX: 298 + horizontalInset + 667.5 * scale,
        clientY: 250 + 280 * scale,
      },
      { width: 760, height: 560 },
      { left: 298, top: 250, width: 621, height: 417 },
    );
    expect(point.x).toBeCloseTo(667.5);
    expect(point.y).toBeCloseTo(280);
  });
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

  it.each([
    ["top", { x1: 45, y1: 7, x2: 125, y2: 7 }],
    ["right", { x1: 405, y1: 47, x2: 405, y2: 127 }],
    ["bottom", { x1: 45, y1: 327, x2: 125, y2: 327 }],
    ["left", { x1: 5, y1: 47, x2: 5, y2: 127 }],
  ] as const)("maps a wall element onto the %s wall", (wall, expected) => {
    expect(wallElementToPlanLine({
      id: "wall-element_one",
      kind: "door",
      name: "Door",
      wall,
      offsetCm: 20,
      widthCm: 40,
    }, {
      scale: 2,
      offsetX: 5,
      offsetY: 7,
      roomWidth: 400,
      roomHeight: 320,
    })).toMatchObject(expected);
  });
});
