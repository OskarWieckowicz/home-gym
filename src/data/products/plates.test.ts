import { describe, expect, it } from "vitest";

import { createEquipmentFootprints } from "@/features/geometry/equipment-footprints";

import { plateSeeds } from "./plates";

const EXPECTED_USE_ZONES = {
  product_foundry_bumper_plates: { frontCm: 20, backCm: 5, leftCm: 20, rightCm: 20 },
  product_cairn_iron_plates: { frontCm: 20, backCm: 5, leftCm: 20, rightCm: 20 },
  product_delta_change_plates: { frontCm: 15, backCm: 5, leftCm: 15, rightCm: 15 },
} as const;

describe("plate planning areas", () => {
  it.each(plateSeeds)("keeps $name's use zone close to its stored footprint", (product) => {
    const expectedUseZone = EXPECTED_USE_ZONES[product.id as keyof typeof EXPECTED_USE_ZONES];
    expect(expectedUseZone).toBeDefined();
    expect(product.useZone).toEqual(expectedUseZone);

    const { physical, useZone } = createEquipmentFootprints(
      { position: { xCm: 100, zCm: 100 }, rotation: 0 },
      product,
    );

    expect(useZone.widthCm - physical.widthCm).toBeLessThanOrEqual(40);
    expect(useZone.depthCm - physical.depthCm).toBeLessThanOrEqual(25);
  });
});
