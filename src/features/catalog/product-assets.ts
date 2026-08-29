const PRODUCT_IMAGE_BY_ID = {
  product_summit_power_cage: "/assets/squat-rack-catalog.png",
} as const;

export function getProductImage(productId: string): string | undefined {
  return PRODUCT_IMAGE_BY_ID[productId as keyof typeof PRODUCT_IMAGE_BY_ID];
}
