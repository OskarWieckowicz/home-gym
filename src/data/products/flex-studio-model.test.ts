import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { getProductImage } from "@/features/catalog/product-assets";
import { findProductById } from "@/features/catalog/queries/catalog";
import { getVisualAsset } from "@/features/creator/scene/visual-assets";

const productId = "product_flex_studio_dumbbells";

describe("Flex Studio Dumbbells model integration", () => {
  it("preserves the existing catalog footprint, price, mass and placement requirements", () => {
    expect(findProductById(productId)).toMatchObject({
      slug: "flex-studio-dumbbells",
      name: "Flex Studio Dumbbells",
      brand: "Tempo Harbor",
      category: "dumbbells",
      placementMode: "floor",
      dimensions: { widthCm: 46, depthCm: 24, heightCm: 18 },
      useZone: { frontCm: 35, backCm: 10, leftCm: 35, rightCm: 35 },
      price: 399,
      weightKg: 18,
      requirements: { flooring: "level-hard-surface" },
    });
  });

  it("provides the approved photo and matching model/top view at the catalog size", () => {
    const product = findProductById(productId)!;
    const visual = getVisualAsset(productId)!;
    expect(visual).toEqual({
      productId,
      src: "/assets/flex-studio-dumbbells.glb",
      topViewSrc: "/assets/flex-studio-dumbbells-top.svg",
      envelopeCm: product.dimensions,
      forward: "negative-z",
      floorPivot: "origin",
      scale: [1, 1, 1],
    });
    const image = getProductImage(productId);
    expect(image).toBe("/assets/flex-studio-dumbbells-catalog-concept-v1.png");
    for (const path of [image!, visual.src, visual.topViewSrc!]) {
      expect(existsSync(join(process.cwd(), "public", path)), path).toBe(true);
    }
  });
});
