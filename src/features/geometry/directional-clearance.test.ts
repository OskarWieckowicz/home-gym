import { describe, expect, it } from "vitest";

import {
  expandFootprintByDirectionalMargins,
  getRotatedDirectionalInsets,
} from "./directional-clearance";

const margins = { frontCm: 40, backCm: 10, leftCm: 20, rightCm: 30 };

describe("directional clearance", () => {
  it.each([
    [0, { minX: 20, minZ: 10, maxX: 30, maxZ: 40 }],
    [90, { minX: 40, minZ: 20, maxX: 10, maxZ: 30 }],
    [180, { minX: 30, minZ: 40, maxX: 20, maxZ: 10 }],
    [270, { minX: 10, minZ: 30, maxX: 40, maxZ: 20 }],
  ] as const)("rotates asymmetric margins at %s degrees", (rotation, expected) => {
    expect(getRotatedDirectionalInsets(margins, rotation)).toEqual(expected);
  });

  it("expands an already-rotated physical footprint without mutating it", () => {
    const physical = { minX: 100, minZ: 200, maxX: 150, maxZ: 300 };
    expect(expandFootprintByDirectionalMargins(physical, margins, 90)).toEqual({
      minX: 60,
      minZ: 180,
      maxX: 160,
      maxZ: 330,
      widthCm: 100,
      depthCm: 150,
    });
    expect(physical).toEqual({ minX: 100, minZ: 200, maxX: 150, maxZ: 300 });
  });
});
