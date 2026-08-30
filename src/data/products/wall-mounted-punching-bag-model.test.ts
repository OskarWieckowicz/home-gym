import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getProductImage } from "@/features/catalog/product-assets";
import { findProductById } from "@/features/catalog/queries/catalog";
import { getVisualAsset } from "@/features/creator/scene/visual-assets";
import { equipmentBoxToScene } from "@/features/creator/scene/scene-transform";

describe("Wall-mounted punching bag visual integration", () => {
  it("maps photo, model and top view to the same mounted catalog envelope", () => {
    const productId = "product_wall_mounted_punching_bag";
    const product = findProductById(productId)!;
    const visual = getVisualAsset(productId)!;
    expect(visual.envelopeCm).toEqual(product.dimensions);
    expect(visual.scale).toEqual([1, 1, 1]);
    expect(visual.forward).toBe("negative-z");
    expect(visual.floorPivot).toBe("origin");
    expect(visual.src).toBe("/assets/wall-mounted-punching-bag.glb");
    expect(visual.topViewSrc).toBe("/assets/wall-mounted-punching-bag-top.svg");
    const image = getProductImage(productId);
    expect(image).toBe("/assets/wall-mounted-punching-bag-catalog-concept-v1.png");
    for (const path of [image!, visual.src, visual.topViewSrc!]) {
      expect(existsSync(join(process.cwd(), "public", path)), path).toBe(true);
    }
    expect(product.mounting).toEqual({ kind: "wall", bottomHeightCm: 30, blocksFloor: true });
    const box = equipmentBoxToScene({ position: { xCm: 200, zCm: 0 }, rotation: 0 }, product.dimensions,
      { widthCm: 500, depthCm: 500, heightCm: 250 }, product.mounting!.bottomHeightCm);
    expect(box.position.y - box.dimensions.y / 2).toBeCloseTo(0.3);
    expect(box.position.y + box.dimensions.y / 2).toBeCloseTo(2.2);
  });
});
