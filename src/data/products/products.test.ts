import { describe, expect, it } from "vitest";

import { PRODUCT_CATEGORIES, productSchema } from "@/features/catalog/schemas";

import { catalogProducts } from "./products";

describe("catalogProducts", () => {
  it("contains a compact schema-valid fictional catalog", () => {
    expect(catalogProducts).toHaveLength(10);
    expect(() => productSchema.array().parse(catalogProducts)).not.toThrow();
    expect(catalogProducts.every(({ brand }) => !/nike|adidas|rogue/i.test(brand))).toBe(true);
  });

  it("uses unique stable IDs and slugs", () => {
    expect(new Set(catalogProducts.map(({ id }) => id))).toHaveLength(catalogProducts.length);
    expect(new Set(catalogProducts.map(({ slug }) => slug))).toHaveLength(catalogProducts.length);
  });

  it("represents every required category", () => {
    const categories = new Set(catalogProducts.map(({ category }) => category));
    expect([...PRODUCT_CATEGORIES].every((category) => categories.has(category))).toBe(true);
  });

  it("includes equipment for the strength-plus-compact-cardio scenario", () => {
    expect(catalogProducts.some(({ category }) => category === "racks")).toBe(true);
    expect(catalogProducts.some(({ category }) => category === "benches")).toBe(true);
    expect(catalogProducts.some(({ category }) => category === "weights")).toBe(true);
    expect(
      catalogProducts.some(
        ({ category, dimensions }) => category === "cardio" && dimensions.depthCm < 100,
      ),
    ).toBe(true);
  });

  it("exports the parsed collection as a readonly runtime value", () => {
    expect(Object.isFrozen(catalogProducts)).toBe(true);
    expect(Object.isFrozen(catalogProducts[0])).toBe(true);
    expect(Object.isFrozen(catalogProducts[0].dimensions)).toBe(true);
    expect(Object.isFrozen(catalogProducts[0].trainingGoals)).toBe(true);
    expect(() => {
      catalogProducts[0].dimensions.widthCm = 1;
    }).toThrow();
  });
});
