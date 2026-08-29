import { describe, expect, it } from "vitest";
import { getProductImage } from "./product-assets";

describe("catalog product assets", () => {
  it("maps accepted catalog images explicitly", () => {
    expect(getProductImage("product_arc_adjustable_bench")).toBe("/assets/arc-adjustable-bench-catalog-concept-v1.png");
    expect(getProductImage("product_summit_power_cage")).toBe("/assets/squat-rack-catalog.png");
    expect(getProductImage("product_northstar_half_rack")).toBeUndefined();
  });
});
