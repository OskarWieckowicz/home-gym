import { describe, expect, it } from "vitest";
import { getProductImage } from "./product-assets";

describe("catalog product assets", () => {
  it("maps accepted catalog images explicitly", () => {
    expect(getProductImage("product_anchor_pullup_bar")).toBe("/assets/anchor-pullup-bar-catalog.png");
    expect(getProductImage("product_arc_adjustable_bench")).toBe("/assets/arc-adjustable-bench-catalog-concept-v1.png");
    expect(getProductImage("product_cairn_iron_plates")).toBe("/assets/cairn-iron-plates-catalog.png");
    expect(getProductImage("product_current_fold_bike")).toBe("/assets/current-fold-bike-catalog.png");
    expect(getProductImage("product_delta_change_plates")).toBe("/assets/delta-change-plates-catalog.png");
    expect(getProductImage("product_forge_kettlebell_16kg")).toBe("/assets/forge-kettlebell-16kg-catalog.png");
    expect(getProductImage("product_groundwork_exercise_mat")).toBe("/assets/groundwork-exercise-mat-catalog.png");
    expect(getProductImage("product_groundwork_foam_roller")).toBe("/assets/groundwork-foam-roller-catalog.png");
    expect(getProductImage("product_harbor_squat_stands")).toBe("/assets/harbor-squat-stands-catalog.png");
    expect(getProductImage("product_summit_power_cage")).toBe("/assets/squat-rack-catalog.png");
    expect(getProductImage("product_summit_strength_station")).toBe("/assets/summit-strength-station-catalog.png");
    expect(getProductImage("product_northstar_half_rack")).toBe("/assets/northstar-half-rack-catalog.png");
    expect(getProductImage("product_pivot_flat_bench")).toBe("/assets/pivot-flat-bench-catalog.png");
    expect(getProductImage("product_quarry_power_bar")).toBe("/assets/quarry-power-bar-catalog.png");
    expect(getProductImage("product_range_adjustable_dumbbells")).toBe("/assets/range-adjustable-dumbbells-catalog.png");
    expect(getProductImage("product_signal_resistance_bands")).toBe("/assets/signal-resistance-bands-catalog.png");
    expect(getProductImage("product_surge_compact_treadmill")).toBe("/assets/surge-compact-treadmill-catalog.png");
    expect(getProductImage("product_foundry_wall_rack")).toBeUndefined();
  });
});
