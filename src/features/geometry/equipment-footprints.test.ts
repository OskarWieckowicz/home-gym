import { describe, expect, it } from "vitest";

import {
  createEquipmentFootprints,
  getUseZoneMarginRectangles,
} from "./equipment-footprints";

const product = {
  dimensions: { widthCm: 100, depthCm: 50 },
  useZone: { frontCm: 40, backCm: 10, leftCm: 20, rightCm: 30 },
};

describe("createEquipmentFootprints", () => {
  it.each([
    [0, { minX: 80, minZ: 190, maxX: 230, maxZ: 290 }],
    [90, { minX: 60, minZ: 180, maxX: 160, maxZ: 330 }],
    [180, { minX: 70, minZ: 160, maxX: 220, maxZ: 260 }],
    [270, { minX: 90, minZ: 170, maxX: 190, maxZ: 320 }],
  ] as const)("rotates an asymmetric use zone at %s degrees", (rotation, expected) => {
    const footprints = createEquipmentFootprints(
      { position: { xCm: 100, zCm: 200 }, rotation },
      product,
    );

    expect(footprints.useZone).toMatchObject(expected);
  });

  it("keeps the physical footprint independent from the use zone", () => {
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

describe("getUseZoneMarginRectangles", () => {
  it("partitions an asymmetric use zone around the physical footprint", () => {
    expect(getUseZoneMarginRectangles(
      { minX: 70, minZ: 190, maxX: 230, maxZ: 290 },
      { minX: 100, minZ: 200, maxX: 200, maxZ: 250 },
    )).toEqual([
      { minX: 70, minZ: 190, maxX: 230, maxZ: 200 },
      { minX: 70, minZ: 200, maxX: 100, maxZ: 250 },
      { minX: 200, minZ: 200, maxX: 230, maxZ: 250 },
      { minX: 70, minZ: 250, maxX: 230, maxZ: 290 },
    ]);
  });

  it("excludes zero-area strips for an edge-aligned rotated footprint", () => {
    const footprints = createEquipmentFootprints(
      { position: { xCm: 0, zCm: 140 }, rotation: 270 },
      product,
    );
    expect(getUseZoneMarginRectangles(
      footprints.useZone,
      footprints.physical,
    )).toEqual([
      { minX: -10, minZ: 110, maxX: 90, maxZ: 140 },
      { minX: -10, minZ: 140, maxX: 0, maxZ: 240 },
      { minX: 50, minZ: 140, maxX: 90, maxZ: 240 },
      { minX: -10, minZ: 240, maxX: 90, maxZ: 260 },
    ]);
  });

  it("preserves an untouched rectangle when physical only touches its edge", () => {
    expect(getUseZoneMarginRectangles(
      { minX: 0, minZ: 0, maxX: 20, maxZ: 20 },
      { minX: 20, minZ: 0, maxX: 30, maxZ: 20 },
    )).toEqual([{ minX: 0, minZ: 0, maxX: 20, maxZ: 20 }]);
  });
});
