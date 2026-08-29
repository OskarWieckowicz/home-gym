import { describe, expect, it } from "vitest";
import { getVisualAsset, visualAssetRegistry } from "./visual-assets";

describe("visual asset registry", () => {
  it("maps only the accepted Summit Power Cage product explicitly", () => {
    expect(getVisualAsset("product_summit_power_cage")?.src).toBe("/assets/squat-rack.glb");
    expect(getVisualAsset("product_northstar_half_rack")).toBeUndefined();
    expect(visualAssetRegistry.product_summit_power_cage.envelopeCm).toEqual({ widthCm: 130, depthCm: 165, heightCm: 225 });
  });
});
