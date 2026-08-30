import { describe, expect, it } from "vitest";

import { createRectangleFootprint } from "./rectangles";
import {
  constrainMountedDrag,
  getMountedWall,
  getWallMountFlushGap,
  getWallMountSpan,
  isFlushToMountedWall,
  nearestMountedWall,
  snapWallMountedPlacement,
} from "./wall-mounting";

const room = { widthCm: 300, depthCm: 400 };
const bar = { widthCm: 112, depthCm: 54 };

describe("wall mounting geometry", () => {
  it.each([
    [0, "top"],
    [90, "right"],
    [180, "bottom"],
    [270, "left"],
  ] as const)("maps rotation %s to the %s wall", (rotation, wall) => {
    expect(getMountedWall(rotation)).toBe(wall);
  });

  it.each([
    [0, { xCm: 20, zCm: 0 }, 0],
    [90, { xCm: 246, zCm: 80 }, 0],
    [180, { xCm: 20, zCm: 346 }, 0],
    [270, { xCm: 0, zCm: 80 }, 0],
  ] as const)("reports a zero flush gap at rotation %s", (rotation, position, gap) => {
    const footprint = createRectangleFootprint(position, bar, rotation);
    const wall = getMountedWall(rotation);
    expect(getWallMountFlushGap(footprint, room, wall)).toBe(gap);
    expect(isFlushToMountedWall(footprint, room, wall)).toBe(true);
  });

  it("returns a signed gap when the back edge is off the wall", () => {
    const footprint = createRectangleFootprint({ xCm: 200, zCm: 80 }, bar, 90);
    expect(getWallMountFlushGap(footprint, room, "right")).toBe(46);
    expect(isFlushToMountedWall(footprint, room, "right")).toBe(false);
  });

  it.each([
    ["top", { xCm: 10, zCm: 0 }, 0, { startCm: 10, endCm: 122 }],
    ["right", { xCm: 246, zCm: 40 }, 90, { startCm: 40, endCm: 152 }],
    ["bottom", { xCm: 10, zCm: 346 }, 180, { startCm: 10, endCm: 122 }],
    ["left", { xCm: 0, zCm: 40 }, 270, { startCm: 40, endCm: 152 }],
  ] as const)("spans the %s wall along the opening axis", (wall, position, rotation, span) => {
    expect(getWallMountSpan(createRectangleFootprint(position, bar, rotation), wall)).toEqual(span);
  });

  it("breaks nearest-wall ties in top, right, bottom, left order", () => {
    expect(nearestMountedWall({ xCm: 200, zCm: 100 }, room)).toBe("top");
    expect(nearestMountedWall({ xCm: 250, zCm: 200 }, room)).toBe("right");
    expect(nearestMountedWall({ xCm: 150, zCm: 350 }, room)).toBe("bottom");
    expect(nearestMountedWall({ xCm: 40, zCm: 200 }, room)).toBe("left");
  });

  it("snaps a drop to a flush mount on the nearest wall", () => {
    expect(snapWallMountedPlacement({ xCm: 280, zCm: 140 }, bar, room)).toEqual({
      rotation: 90,
      position: { xCm: 246, zCm: 84 },
    });
    expect(snapWallMountedPlacement({ xCm: 150, zCm: 20 }, bar, room)).toEqual({
      rotation: 0,
      position: { xCm: 94, zCm: 0 },
    });
  });

  it("rejects an along-wall drag that stays flush and rejects a drag off the wall", () => {
    expect(constrainMountedDrag({ xCm: 246, zCm: 120 }, 90, bar, room)).toEqual({
      xCm: 246,
      zCm: 120,
    });
    expect(constrainMountedDrag({ xCm: 200, zCm: 120 }, 90, bar, room)).toBeNull();
  });
});
