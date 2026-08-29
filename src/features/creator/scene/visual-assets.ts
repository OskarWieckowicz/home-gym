export const VISUAL_ASSET_IDS = ["product_summit_power_cage"] as const;
export type VisualAssetProductId = (typeof VISUAL_ASSET_IDS)[number];

export type VisualAssetDefinition = {
  readonly productId: VisualAssetProductId;
  readonly src: string;
  readonly envelopeCm: { readonly widthCm: 130; readonly depthCm: 165; readonly heightCm: 225 };
  readonly forward: "negative-z";
  readonly floorPivot: "origin";
};

export const visualAssetRegistry: Readonly<Record<VisualAssetProductId, VisualAssetDefinition>> = {
  product_summit_power_cage: {
    productId: "product_summit_power_cage",
    src: "/assets/squat-rack.glb",
    envelopeCm: { widthCm: 130, depthCm: 165, heightCm: 225 },
    forward: "negative-z",
    floorPivot: "origin",
  },
};

export function getVisualAsset(productId: string): VisualAssetDefinition | undefined {
  return visualAssetRegistry[productId as VisualAssetProductId];
}
