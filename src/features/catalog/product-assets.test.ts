import { describe, expect, it } from "vitest";
import { getProductImage } from "./product-assets";

describe("catalog product assets", () => {
  it("maps accepted catalog images explicitly", () => {
    expect(getProductImage("product_anchor_pullup_bar")).toBe("/assets/anchor-pullup-bar-catalog.png");
    expect(getProductImage("product_arc_adjustable_bench")).toBe("/assets/arc-adjustable-bench-catalog-concept-v1.png");
    expect(getProductImage("product_cairn_iron_plates")).toBe("/assets/cairn-iron-plates-catalog.png");
    expect(getProductImage("product_delta_change_plates")).toBe("/assets/delta-change-plates-catalog.png");
    expect(getProductImage("product_harbor_squat_stands")).toBe("/assets/harbor-squat-stands-catalog.png");
    expect(getProductImage("product_summit_power_cage")).toBe("/assets/squat-rack-catalog.png");
    expect(getProductImage("product_summit_strength_station")).toBe("/assets/strength-station-composition-top.svg");
    expect(getProductImage("product_northstar_half_rack")).toBeUndefined();
  });
});
