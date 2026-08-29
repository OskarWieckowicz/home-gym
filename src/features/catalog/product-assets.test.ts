import { describe, expect, it } from "vitest";
import { getProductImage } from "./product-assets";

describe("catalog product assets", () => {
  it("maps the Summit Power Cage catalog image explicitly", () => {
    expect(getProductImage("product_summit_power_cage")).toBe("/assets/squat-rack-catalog.png");
    expect(getProductImage("product_northstar_half_rack")).toBeUndefined();
  });
});
