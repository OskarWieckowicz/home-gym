const PRODUCT_IMAGE_BY_ID = {
  product_arc_adjustable_bench: "/assets/arc-adjustable-bench-catalog-concept-v1.png",
  product_summit_power_cage: "/assets/squat-rack-catalog.png",
  product_summit_strength_station: "/assets/strength-station-composition-top.svg",
} as const;

export function getProductImage(productId: string): string | undefined {
  return PRODUCT_IMAGE_BY_ID[productId as keyof typeof PRODUCT_IMAGE_BY_ID];
}
