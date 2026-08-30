export const VISUAL_ASSET_IDS = [
  "product_anchor_pullup_bar",
  "product_arc_adjustable_bench",
  "product_cairn_iron_plates",
  "product_current_fold_bike",
  "product_delta_change_plates",
  "product_foundry_bumper_plates",
  "product_harbor_squat_stands",
  "product_northstar_half_rack",
  "product_pivot_flat_bench",
  "product_quarry_power_bar",
  "product_range_adjustable_dumbbells",
  "product_summit_power_cage",
  "product_summit_strength_station",
] as const;
export type VisualAssetProductId = (typeof VISUAL_ASSET_IDS)[number];

export type VisualAssetDefinition = {
  readonly productId: VisualAssetProductId;
  readonly src: string;
  readonly topViewSrc?: string;
  readonly envelopeCm: { readonly widthCm: number; readonly depthCm: number; readonly heightCm: number };
  readonly forward: "negative-z";
  readonly floorPivot: "origin";
  readonly scale: readonly [number, number, number];
};

export const visualAssetRegistry: Readonly<Record<VisualAssetProductId, VisualAssetDefinition>> = {
  product_range_adjustable_dumbbells: {
    productId: "product_range_adjustable_dumbbells",
    src: "/assets/range-adjustable-dumbbells.glb",
    topViewSrc: "/assets/range-adjustable-dumbbells-top.svg",
    envelopeCm: { widthCm: 48, depthCm: 54, heightCm: 62 },
    forward: "negative-z",
    floorPivot: "origin",
    scale: [1, 1, 1],
  },
  product_pivot_flat_bench: {
    productId: "product_pivot_flat_bench",
    src: "/assets/pivot-flat-bench.glb",
    topViewSrc: "/assets/pivot-flat-bench-top.svg",
    envelopeCm: { widthCm: 58, depthCm: 124, heightCm: 44 },
    forward: "negative-z",
    floorPivot: "origin",
    scale: [1, 1, 1],
  },
  product_northstar_half_rack: {
    productId: "product_northstar_half_rack",
    src: "/assets/northstar-half-rack.glb",
    topViewSrc: "/assets/northstar-half-rack-top.svg",
    envelopeCm: { widthCm: 122, depthCm: 130, heightCm: 215 },
    forward: "negative-z",
    floorPivot: "origin",
    scale: [1, 1, 1],
  },
  product_anchor_pullup_bar: {
    productId: "product_anchor_pullup_bar",
    src: "/assets/anchor-pullup-bar.glb",
    topViewSrc: "/assets/anchor-pullup-bar-top.svg",
    envelopeCm: { widthCm: 112, depthCm: 54, heightCm: 38 },
    forward: "negative-z",
    floorPivot: "origin",
    scale: [1, 1, 1],
  },
  product_arc_adjustable_bench: {
    productId: "product_arc_adjustable_bench",
    src: "/assets/arc-adjustable-bench.glb",
    topViewSrc: "/assets/arc-adjustable-bench-top.svg",
    envelopeCm: { widthCm: 66, depthCm: 142, heightCm: 46 },
    forward: "negative-z",
    floorPivot: "origin",
    scale: [1, 1, 1],
  },
  product_cairn_iron_plates: {
    productId: "product_cairn_iron_plates",
    src: "/assets/cairn-iron-plates.glb",
    topViewSrc: "/assets/cairn-iron-plates-top.svg",
    envelopeCm: { widthCm: 45, depthCm: 24, heightCm: 45 },
    forward: "negative-z",
    floorPivot: "origin",
    scale: [1, 1, 1],
  },
  product_current_fold_bike: {
    productId: "product_current_fold_bike",
    src: "/assets/current-fold-bike.glb",
    topViewSrc: "/assets/current-fold-bike-top.svg",
    envelopeCm: { widthCm: 53, depthCm: 98, heightCm: 118 },
    forward: "negative-z",
    floorPivot: "origin",
    scale: [1, 1, 1],
  },
  product_delta_change_plates: {
    productId: "product_delta_change_plates",
    src: "/assets/delta-change-plates.glb",
    topViewSrc: "/assets/delta-change-plates-top.svg",
    envelopeCm: { widthCm: 32, depthCm: 18, heightCm: 32 },
    forward: "negative-z",
    floorPivot: "origin",
    scale: [1, 1, 1],
  },
  product_foundry_bumper_plates: {
    productId: "product_foundry_bumper_plates",
    src: "/assets/foundry-bumper-plates.glb",
    topViewSrc: "/assets/foundry-bumper-plates-top.svg",
    envelopeCm: { widthCm: 45, depthCm: 36, heightCm: 45 },
    forward: "negative-z",
    floorPivot: "origin",
    scale: [1, 1, 1],
  },
  product_harbor_squat_stands: {
    productId: "product_harbor_squat_stands",
    src: "/assets/harbor-squat-stands.glb",
    topViewSrc: "/assets/harbor-squat-stands-top.svg",
    envelopeCm: { widthCm: 108, depthCm: 82, heightCm: 178 },
    forward: "negative-z",
    floorPivot: "origin",
    scale: [1, 1, 1],
  },
  product_quarry_power_bar: {
    productId: "product_quarry_power_bar",
    src: "/assets/quarry-power-bar.glb",
    topViewSrc: "/assets/quarry-power-bar-top.svg",
    envelopeCm: { widthCm: 220, depthCm: 5, heightCm: 5 },
    forward: "negative-z",
    floorPivot: "origin",
    scale: [1, 1, 1],
  },
  product_summit_power_cage: {
    productId: "product_summit_power_cage",
    src: "/assets/squat-rack.glb",
    topViewSrc: "/assets/squat-rack-top.svg",
    envelopeCm: { widthCm: 130, depthCm: 165, heightCm: 225 },
    forward: "negative-z",
    floorPivot: "origin",
    scale: [1.016, 1, 1.04],
  },
  product_summit_strength_station: {
    productId: "product_summit_strength_station",
    src: "/assets/strength-station-composition.glb",
    topViewSrc: "/assets/strength-station-composition-top.svg",
    envelopeCm: { widthCm: 228, depthCm: 174, heightCm: 227 },
    forward: "negative-z",
    floorPivot: "origin",
    scale: [1, 1, 1],
  },
};

export function getVisualAsset(productId: string): VisualAssetDefinition | undefined {
  return visualAssetRegistry[productId as VisualAssetProductId];
}
