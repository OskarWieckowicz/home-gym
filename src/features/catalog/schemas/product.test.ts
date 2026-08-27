import { describe, expect, it } from "vitest";
import { z } from "zod";

import { productSchema } from "./product";

const validProduct = {
  id: "product_test_rack",
  slug: "test-rack",
  name: "Test Rack",
  brand: "Imaginary Iron",
  category: "racks",
  description: "A complete valid product used to exercise the runtime contract.",
  price: 1500,
  dimensions: { widthCm: 120, depthCm: 100, heightCm: 210 },
  clearance: { frontCm: 100, backCm: 0, leftCm: 50, rightCm: 50 },
  exercises: ["back squat"],
  trainingGoals: ["strength"],
  muscleGroups: ["legs"],
  weightKg: 80.5,
  maximumLoadKg: 250,
  requirements: {
    minimumCeilingHeightCm: 225,
    anchoring: "recommended",
    flooring: "protective-mat",
    assembly: "two-person",
  },
  constraints: ["Keep the lifting area clear."],
} as const;

describe("productSchema", () => {
  it("parses a complete canonical product", () => {
    expect(productSchema.parse(validProduct)).toEqual(validProduct);
  });

  it.each([
    ["bad slug", { slug: "Bad slug" }],
    ["fractional price", { price: 10.5 }],
    ["invalid category", { category: "machines" }],
  ])("rejects %s", (_label, replacement) => {
    expect(() => productSchema.parse({ ...validProduct, ...replacement })).toThrow();
  });

  it("rejects fractional dimensions", () => {
    expect(() =>
      productSchema.parse({
        ...validProduct,
        dimensions: { ...validProduct.dimensions, widthCm: 119.5 },
      }),
    ).toThrow();
  });

  it("rejects negative clearance", () => {
    expect(() =>
      productSchema.parse({
        ...validProduct,
        clearance: { ...validProduct.clearance, frontCm: -1 },
      }),
    ).toThrow();
  });

  it("rejects a ceiling requirement below the product height", () => {
    expect(() =>
      productSchema.parse({
        ...validProduct,
        requirements: {
          ...validProduct.requirements,
          minimumCeilingHeightCm: validProduct.dimensions.heightCm - 1,
        },
      }),
    ).toThrow(/ceiling height/i);
  });

  it("rejects unknown keys at every object boundary", () => {
    expect(() => productSchema.parse({ ...validProduct, typo: true })).toThrow();
    expect(() =>
      productSchema.parse({
        ...validProduct,
        dimensions: { ...validProduct.dimensions, lengthCm: 100 },
      }),
    ).toThrow();
    expect(() =>
      productSchema.parse({
        ...validProduct,
        requirements: { ...validProduct.requirements, installation: "easy" },
      }),
    ).toThrow();
  });

  it("has an unambiguous Zod JSON Schema representation", () => {
    expect(() => z.toJSONSchema(productSchema)).not.toThrow();
    expect(z.toJSONSchema(productSchema)).toMatchObject({ type: "object", additionalProperties: false });
  });
});
