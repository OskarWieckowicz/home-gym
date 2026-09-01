import { describe, expect, it } from "vitest";

import { SCENE_ROOM_COLORS } from "./scene-presentation";

describe("scene presentation", () => {
  it("keeps the shared room materials in the warm architectural palette", () => {
    expect(SCENE_ROOM_COLORS).toEqual({
      background: "#e9e3d8",
      wall: "#f5f0e7",
      floor: "#b5aea2",
      perimeter: "#817b72",
      obstacle: "#555953",
    });
  });
});
