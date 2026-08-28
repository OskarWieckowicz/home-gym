import { describe, expect, it } from "vitest";

import { createDragSession, dragPositionChanged, getDragPosition } from "./drag-session";

describe("drag session", () => {
  const session = createDragSession("obstacle_one", 3, { x: 100, y: 100 }, { xCm: 20, zCm: 30 });

  it("converts many pointer moves into an ephemeral snapped position", () => {
    expect(getDragPosition(session, { x: 136, y: 81 }, { scale: 2 }, 10)).toEqual({ xCm: 40, zCm: 20 });
  });

  it("clamps only the minimum corner", () => {
    expect(getDragPosition(session, { x: -1000, y: -1000 }, { scale: 1 }, 10)).toEqual({ xCm: 0, zCm: 0 });
    expect(getDragPosition(session, { x: 1000, y: 1000 }, { scale: 1 }, 10)).toEqual({ xCm: 920, zCm: 930 });
  });

  it("detects no-op and committed positions", () => {
    expect(dragPositionChanged(session, { xCm: 20, zCm: 30 })).toBe(false);
    expect(dragPositionChanged(session, { xCm: 30, zCm: 30 })).toBe(true);
  });
});
