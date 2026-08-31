import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  ANCHORING_FILTER_VALUES,
  ANCHORING_REQUIREMENTS,
  PRODUCT_CATEGORIES,
  productSchema,
} from "./product";

const validProduct = {
  id: "product_test_rack",
  slug: "test-rack",
  name: "Test Rack",
  brand: "Imaginary Iron",
  category: "racks",
  description: "A complete valid product used to exercise the runtime contract.",
  price: 1500,
  dimensions: { widthCm: 120, depthCm: 100, heightCm: 210 },
  useZone: { frontCm: 100, backCm: 0, leftCm: 50, rightCm: 50 },
  exercises: ["back squat"],
  trainingGoals: ["strength"],
  muscleGroups: ["legs"],
  placementMode: "floor",
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

  it("publishes the seven-category MVP vocabulary without the retired weights category", () => {
    expect(PRODUCT_CATEGORIES).toEqual([
      "racks",
      "benches",
      "free-weights",
      "cable-machines",
      "bodyweight-training",
      "cardio-conditioning",
      "mobility-recovery",
    ]);
    expect(PRODUCT_CATEGORIES).not.toContain("weights");
  });

  it("keeps none as a filter value rather than a stored anchoring requirement", () => {
    expect(ANCHORING_REQUIREMENTS).toEqual(["recommended", "required"]);
    expect(ANCHORING_FILTER_VALUES).toEqual(["none", "recommended", "required"]);
    expect(productSchema.parse({
      ...validProduct,
      requirements: { ...validProduct.requirements, anchoring: undefined },
    }).requirements.anchoring).toBeUndefined();
    expect(() => productSchema.parse({
      ...validProduct,
      requirements: { ...validProduct.requirements, anchoring: "none" },
    })).toThrow();
  });

  it.each([
    ["bad slug", { slug: "Bad slug" }],
    ["fractional price", { price: 10.5 }],
    ["invalid category", { category: "machines" }],
    ["missing placement mode", { placementMode: undefined }],
    ["invalid placement mode", { placementMode: "wall" }],
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

  it("rejects negative use zone", () => {
    expect(() =>
      productSchema.parse({
        ...validProduct,
        useZone: { ...validProduct.useZone, frontCm: -1 },
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

  it("accepts a wall-mounted product whose ceiling covers the mounted top", () => {
    expect(
      productSchema.parse({
        ...validProduct,
        mounting: { kind: "wall", bottomHeightCm: 195 },
        requirements: {
          ...validProduct.requirements,
          minimumCeilingHeightCm: 195 + validProduct.dimensions.heightCm,
        },
      }).mounting,
    ).toEqual({ kind: "wall", bottomHeightCm: 195 });
  });

  it("accepts a floor-sitting wall mount at 0 cm", () => {
    expect(
      productSchema.parse({
        ...validProduct,
        mounting: { kind: "wall", bottomHeightCm: 0, blocksFloor: true },
      }).mounting,
    ).toEqual({ kind: "wall", bottomHeightCm: 0, blocksFloor: true });
  });

  it("rejects a negative mount height", () => {
    expect(() =>
      productSchema.parse({
        ...validProduct,
        mounting: { kind: "wall", bottomHeightCm: -1 },
      }),
    ).toThrow();
  });

  it("rejects a ceiling requirement below the mounted product top", () => {
    expect(() =>
      productSchema.parse({
        ...validProduct,
        mounting: { kind: "wall", bottomHeightCm: 195 },
        requirements: {
          ...validProduct.requirements,
          minimumCeilingHeightCm: 194 + validProduct.dimensions.heightCm,
        },
      }),
    ).toThrow(/mounted product top/i);
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
    const jsonSchema = z.toJSONSchema(productSchema);

    expect(jsonSchema).toMatchObject({ type: "object", additionalProperties: false });
    expect(jsonSchema.properties?.category).toMatchObject({ enum: PRODUCT_CATEGORIES });
    expect(jsonSchema.properties?.placementMode).toMatchObject({
      enum: ["floor", "selection-only"],
    });
    expect(jsonSchema.properties?.requirements).toMatchObject({
      properties: {
        anchoring: { enum: ANCHORING_REQUIREMENTS },
      },
    });
  });
});
