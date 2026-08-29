const PRODUCT_IMAGE_BY_ID = {
  product_anchor_pullup_bar: "/assets/anchor-pullup-bar-catalog.png",
  product_arc_adjustable_bench: "/assets/arc-adjustable-bench-catalog-concept-v1.png",
  product_cairn_iron_plates: "/assets/cairn-iron-plates-catalog.png",
  product_delta_change_plates: "/assets/delta-change-plates-catalog.png",
  product_harbor_squat_stands: "/assets/harbor-squat-stands-catalog.png",
  product_summit_power_cage: "/assets/squat-rack-catalog.png",
  product_summit_strength_station: "/assets/strength-station-composition-top.svg",
} as const;

export function getProductImage(productId: string): string | undefined {
  return PRODUCT_IMAGE_BY_ID[productId as keyof typeof PRODUCT_IMAGE_BY_ID];
}
