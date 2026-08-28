import { describe, expect, it } from "vitest";

import { fitsRoomHeight, getOutsideHorizontalAxes } from "./room-bounds";

const room = { widthCm: 400, depthCm: 300, heightCm: 240 };

describe("room bounds", () => {
  it("accepts exact horizontal boundaries and exact room height", () => {
    expect(
      getOutsideHorizontalAxes(
        { minX: 0, minZ: 0, maxX: 400, maxZ: 300 },
        room,
      ),
    ).toEqual([]);
    expect(fitsRoomHeight(240, room)).toBe(true);
  });

  it.each([
    ["minimum x", { minX: -1, minZ: 0, maxX: 10, maxZ: 10 }, ["x"]],
    ["maximum x", { minX: 390, minZ: 0, maxX: 401, maxZ: 10 }, ["x"]],
    ["minimum z", { minX: 0, minZ: -1, maxX: 10, maxZ: 10 }, ["z"]],
    ["maximum z", { minX: 0, minZ: 290, maxX: 10, maxZ: 301 }, ["z"]],
    ["both axes", { minX: -1, minZ: 0, maxX: 401, maxZ: 301 }, ["x", "z"]],
  ] as const)("reports one-centimeter overflow at %s", (_label, bounds, axes) => {
    expect(getOutsideHorizontalAxes(bounds, room)).toEqual(axes);
  });

  it("rejects only heights above the room", () => {
    expect(fitsRoomHeight(239, room)).toBe(true);
    expect(fitsRoomHeight(241, room)).toBe(false);
  });
});
