import { describe, expect, it } from "vitest";

import { createEquipmentFootprints } from "./equipment-footprints";

const product = {
  dimensions: { widthCm: 100, depthCm: 50 },
  clearance: { frontCm: 40, backCm: 10, leftCm: 20, rightCm: 30 },
};

describe("createEquipmentFootprints", () => {
  it.each([
    [0, { minX: 80, minZ: 190, maxX: 230, maxZ: 290 }],
    [90, { minX: 60, minZ: 180, maxX: 160, maxZ: 330 }],
    [180, { minX: 70, minZ: 160, maxX: 220, maxZ: 260 }],
    [270, { minX: 90, minZ: 170, maxX: 190, maxZ: 320 }],
  ] as const)("rotates asymmetric clearance at %s degrees", (rotation, expected) => {
    const footprints = createEquipmentFootprints(
      { position: { xCm: 100, zCm: 200 }, rotation },
      product,
    );

    expect(footprints.clearance).toMatchObject(expected);
  });

  it("keeps the physical footprint independent from clearance", () => {
    expect(
      createEquipmentFootprints(
        { position: { xCm: 10, zCm: 20 }, rotation: 90 },
        product,
      ),
    ).toMatchObject({
      physical: {
        minX: 10,
        minZ: 20,
        maxX: 60,
        maxZ: 120,
        widthCm: 50,
        depthCm: 100,
      },
    });
  });
});

