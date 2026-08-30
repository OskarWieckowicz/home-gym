import { describe, expect, it } from "vitest";
import { findProductById } from "@/features/catalog/queries/catalog";
import { getVisualAsset, visualAssetRegistry } from "./visual-assets";

describe("visual asset registry", () => {
  it("keeps the kettlebell visual envelope aligned with its catalog dimensions", () => {
    const product = findProductById("product_forge_kettlebell_16kg");
    expect(product).toBeDefined();
    expect(getVisualAsset("product_forge_kettlebell_16kg")?.envelopeCm).toEqual(product?.dimensions);
  });
  it("maps accepted product models explicitly", () => {
    expect(getVisualAsset("product_forge_kettlebell_16kg")).toMatchObject({
      src: "/assets/forge-kettlebell-16kg.glb",
      topViewSrc: "/assets/forge-kettlebell-16kg-top.svg",
      envelopeCm: { widthCm: 21, depthCm: 18, heightCm: 28 },
      forward: "negative-z",
      floorPivot: "origin",
      scale: [1, 1, 1],
    });
    expect(getVisualAsset("product_surge_compact_treadmill")).toMatchObject({
      src: "/assets/surge-compact-treadmill.glb",
      topViewSrc: "/assets/surge-compact-treadmill-top.svg",
      envelopeCm: { widthCm: 78, depthCm: 162, heightCm: 138 },
      forward: "negative-z",
      floorPivot: "origin",
      scale: [1, 1, 1],
    });
    expect(getVisualAsset("product_range_adjustable_dumbbells")).toMatchObject({
      src: "/assets/range-adjustable-dumbbells.glb",
      topViewSrc: "/assets/range-adjustable-dumbbells-top.svg",
      envelopeCm: { widthCm: 48, depthCm: 54, heightCm: 62 },
      forward: "negative-z",
      floorPivot: "origin",
      scale: [1, 1, 1],
    });
    expect(getVisualAsset("product_pivot_flat_bench")).toMatchObject({
      src: "/assets/pivot-flat-bench.glb",
      topViewSrc: "/assets/pivot-flat-bench-top.svg",
      envelopeCm: { widthCm: 58, depthCm: 124, heightCm: 44 },
      forward: "negative-z",
      floorPivot: "origin",
      scale: [1, 1, 1],
    });
    expect(getVisualAsset("product_anchor_pullup_bar")).toMatchObject({
      src: "/assets/anchor-pullup-bar.glb",
      topViewSrc: "/assets/anchor-pullup-bar-top.svg",
      envelopeCm: { widthCm: 112, depthCm: 54, heightCm: 38 },
    });
    expect(getVisualAsset("product_arc_adjustable_bench")).toMatchObject({
      src: "/assets/arc-adjustable-bench.glb",
      topViewSrc: "/assets/arc-adjustable-bench-top.svg",
      envelopeCm: { widthCm: 66, depthCm: 142, heightCm: 46 },
      scale: [1, 1, 1],
    });
    expect(getVisualAsset("product_cairn_iron_plates")).toMatchObject({
      src: "/assets/cairn-iron-plates.glb",
      topViewSrc: "/assets/cairn-iron-plates-top.svg",
      envelopeCm: { widthCm: 45, depthCm: 24, heightCm: 45 },
    });
    expect(getVisualAsset("product_current_fold_bike")).toMatchObject({
      src: "/assets/current-fold-bike.glb",
      topViewSrc: "/assets/current-fold-bike-top.svg",
      envelopeCm: { widthCm: 53, depthCm: 98, heightCm: 118 },
      scale: [1, 1, 1],
    });
    expect(getVisualAsset("product_delta_change_plates")).toMatchObject({
      src: "/assets/delta-change-plates.glb",
      topViewSrc: "/assets/delta-change-plates-top.svg",
      envelopeCm: { widthCm: 32, depthCm: 18, heightCm: 32 },
    });
    expect(getVisualAsset("product_foundry_bumper_plates")).toMatchObject({
      src: "/assets/foundry-bumper-plates.glb",
      topViewSrc: "/assets/foundry-bumper-plates-top.svg",
      envelopeCm: { widthCm: 45, depthCm: 36, heightCm: 45 },
      scale: [1, 1, 1],
    });
    expect(getVisualAsset("product_harbor_squat_stands")).toMatchObject({
      src: "/assets/harbor-squat-stands.glb",
      topViewSrc: "/assets/harbor-squat-stands-top.svg",
      envelopeCm: { widthCm: 108, depthCm: 82, heightCm: 178 },
    });
    expect(getVisualAsset("product_quarry_power_bar")).toMatchObject({
      src: "/assets/quarry-power-bar.glb",
      topViewSrc: "/assets/quarry-power-bar-top.svg",
      envelopeCm: { widthCm: 220, depthCm: 5, heightCm: 5 },
      scale: [1, 1, 1],
    });
    expect(getVisualAsset("product_summit_power_cage")).toMatchObject({
      src: "/assets/squat-rack.glb",
      topViewSrc: "/assets/squat-rack-top.svg",
    });
    expect(getVisualAsset("product_summit_strength_station")).toMatchObject({
      src: "/assets/strength-station-composition.glb",
      topViewSrc: "/assets/strength-station-composition-top.svg",
      envelopeCm: { widthCm: 228, depthCm: 174, heightCm: 227 },
      scale: [1, 1, 1],
    });
    expect(getVisualAsset("product_northstar_half_rack")).toMatchObject({
      src: "/assets/northstar-half-rack.glb",
      topViewSrc: "/assets/northstar-half-rack-top.svg",
      envelopeCm: { widthCm: 122, depthCm: 130, heightCm: 215 },
      forward: "negative-z",
      floorPivot: "origin",
      scale: [1, 1, 1],
    });
    expect(getVisualAsset("product_foundry_wall_rack")).toBeUndefined();
    expect(visualAssetRegistry.product_summit_power_cage.envelopeCm).toEqual({ widthCm: 130, depthCm: 165, heightCm: 225 });
  });
});
